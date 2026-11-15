
import { supabase } from './supabase.js';

// ------------------------------------
// HTML ELEMENTS
// ------------------------------------

const authSection = document.getElementById('authSection');
const app = document.getElementById('app');

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authMessage = document.getElementById('authMessage');

const showSignupBtn = document.getElementById('showSignupBtn');
const showLoginBtn = document.getElementById('showLoginBtn');

const logoutBtn = document.getElementById('logoutBtn');
const currentUserEmail = document.getElementById('currentUserEmail');

const addRecordBtn = document.getElementById('addRecordBtn');
const recordDialog = document.getElementById('recordDialog');
const recordForm = document.getElementById('recordForm');
const exerciseSelect = document.getElementById('exerciseSelect');
const recordWeight = document.getElementById('recordWeight');
const recordDate = document.getElementById('recordDate');
const recordNotes = document.getElementById('recordNotes');
const recordMessage = document.getElementById('recordMessage');
const saveRecordBtn = document.getElementById('saveRecordBtn');

const recordsGrid = document.getElementById('recordsGrid');
const recordSummary = document.getElementById('recordSummary');
const historyDialog = document.getElementById('historyDialog');
const historyTitle = document.getElementById('historyTitle');
const historyBest = document.getElementById('historyBest');
const historyBestDate = document.getElementById('historyBestDate');
const historyBestWeight = document.getElementById('historyBestWeight');
const historyList = document.getElementById('historyList');
const historyMessage = document.getElementById('historyMessage');
const historyMore = document.getElementById('historyMore');

const HISTORY_PAGE_SIZE = 25;
let activeHistory = null;

let currentSession = null;
let availableExercises = [];

// ------------------------------------
// AUTHENTICATION UI
// ------------------------------------

function showMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.style.color = isError ? '#ff7070' : 'var(--accent)';
}

function showLogin() {
    loginForm.hidden = false;
    signupForm.hidden = true;

    authTitle.innerHTML = 'Welcome back<span>.</span>';
    authSubtitle.textContent =
        'Sign in to track your personal records.';

    showMessage('');
}

function showSignup() {
    loginForm.hidden = true;
    signupForm.hidden = false;

    authTitle.innerHTML = 'Create account<span>.</span>';
    authSubtitle.textContent =
        'Start tracking your training progress.';

    showMessage('');
}

showSignupBtn.addEventListener('click', showSignup);
showLoginBtn.addEventListener('click', showLogin);

// ------------------------------------
// LOGIN
// ------------------------------------

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const button = loginForm.querySelector('button[type="submit"]');

    button.disabled = true;
    button.textContent = 'Signing in...';
    showMessage('');

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

    } catch (error) {
        console.error('Login error:', error);
        showMessage(error.message, true);

    } finally {
        button.disabled = false;
        button.textContent = 'Sign in';
    }
});

// ------------------------------------
// SIGN UP
// ------------------------------------

signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const button = signupForm.querySelector('button[type="submit"]');

    button.disabled = true;
    button.textContent = 'Creating account...';
    showMessage('');

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo:
                    window.location.origin + window.location.pathname
            }
        });

        if (error) throw error;

        if (data.session) {
            showMessage('Account created successfully!');
        } else {
            showMessage(
                'Account created! Check your email and confirm your account before signing in.'
            );
        }

        signupForm.reset();

    } catch (error) {
        console.error('Signup error:', error);
        showMessage(error.message, true);

    } finally {
        button.disabled = false;
        button.textContent = 'Create account';
    }
});

// ------------------------------------
// LOAD EXERCISES
// ------------------------------------

async function loadExercises() {
    const { data, error } = await supabase
        .from('exercises')
        .select('id, name, category')
        .order('name');

    if (error) {
        console.error('Error loading exercises:', error);
        exerciseSelect.innerHTML =
            '<option value="">Could not load exercises</option>';
        return;
    }

    availableExercises = data || [];

    exerciseSelect.replaceChildren();

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select an exercise';
    exerciseSelect.appendChild(placeholder);

    availableExercises.forEach((exercise) => {
        const option = document.createElement('option');
        option.value = exercise.id;
        option.textContent = exercise.name;
        exerciseSelect.appendChild(option);
    });

    console.log('Exercises loaded:', availableExercises);
}

// ------------------------------------
// LOAD PERSONAL RECORDS
// ------------------------------------

async function loadPersonalRecords() {
    const userId = currentSession?.user.id;
    if (!userId) return;

    const { data, error } = await supabase
        .from('personal_records')
        .select(`
            exercise_id,
            weight_kg,
            recorded_at,
            exercises (name)
        `)
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });

    if (currentSession?.user.id !== userId) return;

    if (error) {
        console.error('Error loading personal records:', error);
        recordSummary.textContent = '';
        recordsGrid.textContent =
            'Could not load your personal records.';
        return;
    }

    const records = data || [];
    const bestRecords = new Map();

    records.forEach((record) => {
        const exercise = record.exercises;

        if (!exercise) return;

        const existing = bestRecords.get(record.exercise_id);

        if (!existing || Number(record.weight_kg) >
            Number(existing.weight_kg)) {
            bestRecords.set(record.exercise_id, {
                ...record,
                exercise
            });
        }
    });

    recordsGrid.replaceChildren();

    if (bestRecords.size === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'subtitle';
        emptyMessage.textContent =
            'No personal records yet. Add your first record!';
        recordsGrid.appendChild(emptyMessage);
    }

    bestRecords.forEach((record) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'record-card';
        card.setAttribute('aria-haspopup', 'dialog');
        card.addEventListener('click', () => openExerciseHistory(record));

        const details = document.createElement('span');
        details.className = 'record-details';

        const title = document.createElement('span');
        title.className = 'record-name';
        title.textContent = record.exercise.name;

        const weight = document.createElement('span');
        weight.className = 'weight';
        renderWeight(weight, record.weight_kg);

        const date = document.createElement('span');
        date.className = 'record-date';
        date.textContent = formatRecordDate(record.recorded_at);

        const chevron = document.createElement('span');
        chevron.className = 'record-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        chevron.textContent = '›';

        details.append(title, date);
        card.append(details, weight, chevron);
        recordsGrid.appendChild(card);
    });

    const count = bestRecords.size;
    const exerciseLabel = count === 1 ? 'exercise' : 'exercises';
    const recordLabel = count === 1 ? 'personal record' : 'personal records';
    recordSummary.textContent = `${count} ${exerciseLabel} · ${count} ${recordLabel}`;

    console.log('Personal records loaded:', records);
}

// ------------------------------------
// EXERCISE HISTORY
// ------------------------------------

function formatRecordDate(value) {
    return new Date(`${value}T00:00:00`).toLocaleDateString('es-ES');
}

function renderWeight(element, value) {
    const unit = document.createElement('small');
    unit.textContent = 'kg';
    element.textContent = `${Number(value).toLocaleString('es-ES')} `;
    element.appendChild(unit);
}

function openExerciseHistory(record) {
    if (!currentSession) return;

    activeHistory = {
        exerciseId: record.exercise_id,
        userId: currentSession.user.id,
        offset: 0,
        shownIds: new Set()
    };

    historyTitle.textContent = record.exercise.name;
    showHistoryBest(record);
    historyList.replaceChildren();
    historyMore.hidden = true;
    historyMore.disabled = false;
    historyDialog.showModal();
    loadHistoryPage();
}

function showHistoryBest(record) {
    renderWeight(historyBestWeight, record.weight_kg);
    historyBestDate.textContent = formatRecordDate(record.recorded_at);
    historyBest.hidden = false;
}

function appendHistoryLift(lift) {
    const item = document.createElement('li');
    const line = document.createElement('div');
    line.className = 'history-lift-line';

    const date = document.createElement('time');
    date.dateTime = lift.recorded_at;
    date.textContent = formatRecordDate(lift.recorded_at);

    const weight = document.createElement('span');
    weight.className = 'weight';
    renderWeight(weight, lift.weight_kg);

    line.append(date, weight);
    item.appendChild(line);

    if (lift.notes?.trim()) {
        const notes = document.createElement('p');
        notes.className = 'history-note';
        notes.textContent = lift.notes;
        item.appendChild(notes);
    }

    historyList.appendChild(item);
}

async function loadHistoryPage() {
    const history = activeHistory;
    if (!history || historyMore.disabled) return;

    historyMore.disabled = true;
    historyMessage.textContent = 'Loading lifts…';

    const query = (columns) => supabase
        .from('personal_records')
        .select(columns)
        .eq('user_id', history.userId)
        .eq('exercise_id', history.exerciseId);

    try {
        const [page, best] = await Promise.all([
            query('id, weight_kg, recorded_at, notes')
                .order('recorded_at', { ascending: false })
                .order('id', { ascending: false })
                .range(history.offset, history.offset + HISTORY_PAGE_SIZE),
            history.offset === 0
                ? query('weight_kg, recorded_at')
                    .order('weight_kg', { ascending: false })
                    .order('recorded_at', { ascending: false })
                    .limit(1)
                : null
        ]);

        if (activeHistory !== history || !historyDialog.open) return;
        if (page.error || best?.error) throw page.error || best.error;

        if (best) {
            const personalBest = best.data?.[0];
            if (personalBest) showHistoryBest(personalBest);
            else historyBest.hidden = true;
        }

        const lifts = page.data || [];
        for (const lift of lifts.slice(0, HISTORY_PAGE_SIZE)) {
            if (history.shownIds.has(lift.id)) continue;
            appendHistoryLift(lift);
            history.shownIds.add(lift.id);
        }

        history.offset += HISTORY_PAGE_SIZE;
        historyMore.hidden = lifts.length <= HISTORY_PAGE_SIZE;
        historyMore.textContent = 'Load more';
        historyMessage.textContent = history.shownIds.size ? '' : 'No lifts recorded yet.';
    } catch (error) {
        if (activeHistory !== history || !historyDialog.open) return;
        console.error('Error loading exercise history:', error);
        historyMessage.textContent = 'Could not load lifts.';
        historyMore.textContent = 'Try again';
        historyMore.hidden = false;
    } finally {
        if (activeHistory === history) historyMore.disabled = false;
    }
}

historyMore.addEventListener('click', loadHistoryPage);

// ------------------------------------
// RECORD DIALOG
// ------------------------------------

function setDefaultRecordDate() {
    const now = new Date();
    const localDate = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    );

    recordDate.value = localDate.toISOString().slice(0, 10);
}

addRecordBtn.addEventListener('click', () => {
    recordMessage.textContent = '';
    recordForm.reset();
    recordNotes.closest('details').open = false;
    setDefaultRecordDate();
    recordDialog.showModal();
});

function closeRecordDialog() {
    recordDialog.close();
    recordForm.reset();
    recordMessage.textContent = '';
}

document.getElementById('closeRecordDialog')
    .addEventListener('click', closeRecordDialog);

document.getElementById('cancelRecordBtn')
    .addEventListener('click', closeRecordDialog);

// ------------------------------------
// SAVE PERSONAL RECORD
// ------------------------------------

recordForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!currentSession) {
        recordMessage.textContent =
            'Please sign in before saving a record.';
        return;
    }

    const exerciseId = exerciseSelect.value;
    const weightInput = recordWeight.value.trim();
    const weight = Number(weightInput.replace(',', '.'));
    const date = recordDate.value;
    const notes = recordNotes.value.trim();

    if (!exerciseId || !weightInput || !date) {
        recordMessage.textContent =
            'Please complete all required fields.';
        return;
    }

    if (!/^\d*(?:[.,]\d{1,2})?$/.test(weightInput) || weight < 0.01 || weight > 9999) {
        recordMessage.textContent = 'Enter a weight from 0.01 to 9999 kg with up to two decimal places.';
        recordWeight.focus();
        return;
    }

    saveRecordBtn.disabled = true;
    saveRecordBtn.textContent = 'Saving...';
    recordMessage.textContent = '';

    try {
        const { error } = await supabase
            .from('personal_records')
            .insert({
                user_id: currentSession.user.id,
                exercise_id: exerciseId,
                weight_kg: weight,
                recorded_at: date,
                notes: notes || null
            });

        if (error) throw error;

        closeRecordDialog();

        await loadPersonalRecords();

        console.log('Personal record saved successfully!');

    } catch (error) {
        console.error('Error saving personal record:', error);
        recordMessage.textContent = error.message;

    } finally {
        saveRecordBtn.disabled = false;
        saveRecordBtn.textContent = 'Save record';
    }
});

// ------------------------------------
// SESSION MANAGEMENT
// ------------------------------------

async function updateApplication(session) {
    currentSession = session;

    if (session) {
        authSection.hidden = true;
        app.hidden = false;

        currentUserEmail.textContent =
            session.user.email || 'My account';

        await loadExercises();
        await loadPersonalRecords();

    } else {
        app.hidden = true;
        authSection.hidden = false;
        currentUserEmail.textContent = 'My account';
        recordSummary.textContent = '';
        recordsGrid.replaceChildren();

        if (recordDialog.open) {
            recordDialog.close();
        }
        if (historyDialog.open) historyDialog.close();
        activeHistory = null;
        historyTitle.textContent = '';
        historyBest.hidden = true;
        historyBestDate.textContent = '';
        historyBestWeight.replaceChildren();
        historyList.replaceChildren();
    }
}

supabase.auth.onAuthStateChange((event, session) => {
    console.log('Authentication event:', event);

    window.setTimeout(() => {
        updateApplication(session);
    }, 0);
});

// ------------------------------------
// LOGOUT
// ------------------------------------

logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;

    try {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        console.log('Logout successful');

    } catch (error) {
        console.error('Logout error:', error);
        alert('Could not sign out: ' + error.message);

    } finally {
        logoutBtn.disabled = false;
    }
});

setDefaultRecordDate();

console.log('PR Tracker initialized successfully 💪');
