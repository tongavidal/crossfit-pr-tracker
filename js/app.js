
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
    const { data, error } = await supabase
        .from('personal_records')
        .select(`
            id,
            weight_kg,
            recorded_at,
            notes,
            exercises (
                name,
                category
            )
        `)
        .order('recorded_at', { ascending: false });

    if (error) {
        console.error('Error loading personal records:', error);
        recordsGrid.textContent =
            'Could not load your personal records.';
        return;
    }

    const records = data || [];
    const bestRecords = new Map();

    records.forEach((record) => {
        const exercise = record.exercises;

        if (!exercise) return;

        const existing = bestRecords.get(exercise.name);

        if (!existing || Number(record.weight_kg) >
            Number(existing.weight_kg)) {
            bestRecords.set(exercise.name, {
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
        const card = document.createElement('article');
        card.className = 'record-card';

        const top = document.createElement('div');
        top.className = 'record-top';

        const category = document.createElement('span');
        category.className = 'category';
        category.textContent = record.exercise.category;

        const icon = document.createElement('span');
        icon.className = 'record-icon';
        icon.textContent = '🏋️';

        top.append(category, icon);

        const title = document.createElement('h3');
        title.textContent = record.exercise.name;

        const weight = document.createElement('div');
        weight.className = 'weight';
        weight.textContent =
            `${Number(record.weight_kg).toLocaleString('es-ES')} `;

        const unit = document.createElement('small');
        unit.textContent = 'kg';
        weight.appendChild(unit);

        const date = document.createElement('p');
        date.className = 'record-date';

        const formattedDate = new Date(
            `${record.recorded_at}T00:00:00`
        ).toLocaleDateString('es-ES');

        date.textContent = `Personal best · ${formattedDate}`;

        card.append(top, title, weight, date);
        recordsGrid.appendChild(card);
    });

    document.getElementById('totalExercises').textContent =
        bestRecords.size;

    document.getElementById('totalRecords').textContent =
        bestRecords.size;

    document.getElementById('recordCount').textContent =
        `${bestRecords.size} EXERCISES`;

    console.log('Personal records loaded:', records);
}

// ------------------------------------
// RECORD DIALOG
// ------------------------------------

function setDefaultRecordDate() {
    recordDate.value = new Date().toLocaleDateString('en-CA');
}

addRecordBtn.addEventListener('click', () => {
    recordMessage.textContent = '';
    recordForm.reset();
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
    const weight = Number(recordWeight.value);
    const date = recordDate.value;
    const notes = recordNotes.value.trim();

    if (!exerciseId || !weight || weight <= 0 || !date) {
        recordMessage.textContent =
            'Please complete all required fields.';
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

        if (recordDialog.open) {
            recordDialog.close();
        }
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
