
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
const percentDialog = document.getElementById('percentDialog');
const percentTitle = document.getElementById('percentTitle');
const percentBest = document.getElementById('percentBest');
const percentRows = document.getElementById('percentRows');

const HISTORY_PAGE_SIZE = 25;
let activeHistory = null;

let currentSession = null;
let availableExercises = [];
let recentExerciseIds = [];

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
    const userId = currentSession?.user.id;

    const { data, error } = await supabase
        .from('exercises')
        .select('id, name, category')
        .order('name');

    if (currentSession?.user.id !== userId) return;

    if (error) {
        console.error('Error loading exercises:', error);
        exerciseSelect.innerHTML =
            '<option value="">Could not load exercises</option>';
        return;
    }

    availableExercises = data || [];
    if (!recordDialog.open) renderExerciseOptions();
}

function renderExerciseOptions() {
    const selectedId = exerciseSelect.value;
    exerciseSelect.replaceChildren();

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select an exercise';
    exerciseSelect.appendChild(placeholder);

    const exercisesById = new Map(availableExercises.map(exercise => [String(exercise.id), exercise]));
    const recent = recentExerciseIds.map(id => exercisesById.get(id)).filter(Boolean);
    const recentIds = new Set(recent.map(exercise => String(exercise.id)));
    const others = availableExercises.filter(exercise => !recentIds.has(String(exercise.id)));

    function addOptions(container, exercises) {
        for (const exercise of exercises) {
            const option = document.createElement('option');
            option.value = String(exercise.id);
            option.textContent = exercise.name;
            container.appendChild(option);
        }
    }

    if (recent.length) {
        const group = document.createElement('optgroup');
        group.label = 'Recent exercises';
        addOptions(group, recent);
        exerciseSelect.appendChild(group);
    }

    if (recent.length && others.length) {
        const group = document.createElement('optgroup');
        group.label = 'Other exercises';
        addOptions(group, others);
        exerciseSelect.appendChild(group);
    } else {
        addOptions(exerciseSelect, others);
    }

    exerciseSelect.value = exercisesById.has(selectedId) ? selectedId : '';
}

// ------------------------------------
// LOAD PERSONAL RECORDS
// ------------------------------------

async function loadPersonalRecords() {
    const userId = currentSession?.user.id;
    if (!userId) return;

    const pageSize = 500;
    const records = [];

    for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
            .from('personal_records')
            .select('exercise_id, weight_kg, recorded_at, exercises (name)')
            .eq('user_id', userId)
            .order('recorded_at', { ascending: false })
            .order('id', { ascending: false })
            .range(offset, offset + pageSize - 1);

        if (currentSession?.user.id !== userId) return;

        if (error) {
            console.error('Error loading personal records:', error);
            recordSummary.textContent = '';
            recordsGrid.textContent = 'Could not load your personal records.';
            return;
        }

        records.push(...data);
        if (data.length < pageSize) break;
    }

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

    recentExerciseIds = Array.from(bestRecords.keys(), String).slice(0, 5);
    if (availableExercises.length && !recordDialog.open) renderExerciseOptions();

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
        const quickLog = document.createElement('button');
        quickLog.type = 'button';
        quickLog.className = 'record-row-action record-quick-log';
        quickLog.textContent = '+';
        quickLog.setAttribute('aria-label', 'Log a lift for ' + record.exercise.name);
        quickLog.setAttribute('aria-haspopup', 'dialog');
        quickLog.addEventListener('click', () => openRecordDialog(record.exercise_id, record.exercise.name));

        const percentages = document.createElement('button');
        percentages.type = 'button';
        percentages.className = 'record-row-action record-percentages';
        percentages.textContent = '%';
        percentages.setAttribute('aria-label', 'Weight percentages for ' + record.exercise.name);
        percentages.setAttribute('aria-haspopup', 'dialog');
        percentages.addEventListener('click', () => openWeightPercentages(record));

        const row = document.createElement('article');
        row.className = 'record-row';
        row.append(card, quickLog, percentages);
        recordsGrid.appendChild(row);
    });

    const exerciseCount = bestRecords.size;
    const liftCount = records.length;
    const exerciseLabel = exerciseCount === 1 ? 'exercise' : 'exercises';
    const liftLabel = liftCount === 1 ? 'lift' : 'lifts';
    recordSummary.textContent = exerciseCount + ' ' + exerciseLabel + ' · ' + liftCount + ' ' + liftLabel;
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

function openWeightPercentages(record) {
    if (!currentSession) return;

    const bestInHundredths = Math.round(Number(record.weight_kg) * 100);
    percentTitle.textContent = record.exercise.name + ' percentages';
    renderWeight(percentBest, record.weight_kg);
    percentRows.replaceChildren();

    for (let percent = 100; percent >= 50; percent -= 5) {
        const row = document.createElement('tr');
        const label = document.createElement('th');
        label.scope = 'row';
        label.textContent = percent + '%';

        const weight = document.createElement('td');
        const targetInHundredths = Math.round(bestInHundredths * percent / 100);
        renderWeight(weight, targetInHundredths / 100);

        row.append(label, weight);
        percentRows.appendChild(row);
    }

    percentDialog.showModal();
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

function openRecordDialog(exerciseId = '', exerciseName = '') {
    if (!currentSession || saveRecordBtn.disabled) return;

    exerciseSelect.querySelector('[data-quick-log]')?.remove();
    recordMessage.textContent = '';
    recordForm.reset();
    if (exerciseId !== '') {
        const id = String(exerciseId);
        exerciseSelect.value = id;
        if (exerciseSelect.value !== id) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = exerciseName;
            option.dataset.quickLog = '';
            exerciseSelect.appendChild(option);
            exerciseSelect.value = id;
        }
    }
    recordNotes.closest('details').open = false;
    setDefaultRecordDate();
    recordDialog.showModal();
}

addRecordBtn.addEventListener('click', () => openRecordDialog());

recordDialog.addEventListener('close', () => {
    if (recordDialog.open) return;
    exerciseSelect.querySelector('[data-quick-log]')?.remove();
    if (availableExercises.length) renderExerciseOptions();
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
        availableExercises = [];
        recentExerciseIds = [];
        renderExerciseOptions();

        if (recordDialog.open) {
            recordDialog.close();
        }
        if (historyDialog.open) historyDialog.close();
        if (percentDialog.open) percentDialog.close();
        percentTitle.textContent = '';
        percentBest.replaceChildren();
        percentRows.replaceChildren();
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
