
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

const recordsGrid = document.getElementById('recordsGrid');

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

        if (error) {
            throw error;
        }

        console.log('Login successful');

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
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        });

        if (error) {
            throw error;
        }

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
// LOAD EXERCISES FROM SUPABASE
// ------------------------------------

async function loadExercises() {
    const { data, error } = await supabase
        .from('exercises')
        .select('id, name, category')
        .order('name');

    if (error) {
        console.error('Error loading exercises:', error);
        recordsGrid.innerHTML =
            '<p>Could not load exercises. Please try again later.</p>';
        return;
    }

    console.log('Supabase connection successful!');
    console.log('Exercises loaded:', data);

    // No personal records yet.
    // We will implement this in the next step.
    recordsGrid.innerHTML = `
        <p class="subtitle">
            You have ${data.length} exercises available.
            Your personal records will appear here.
        </p>
    `;
}

// ------------------------------------
// SESSION MANAGEMENT
// ------------------------------------

async function updateApplication(session) {
    if (session) {
        authSection.hidden = true;
        app.hidden = false;

        currentUserEmail.textContent =
            session.user.email || 'My account';

        await loadExercises();

    } else {
        app.hidden = true;
        authSection.hidden = false;

        currentUserEmail.textContent = 'My account';
    }
}

// Listen to login, logout and session restoration.
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Authentication event:', event);

    // Defer Supabase queries until the auth callback has finished.
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

        if (error) {
            throw error;
        }

        console.log('Logout successful');

    } catch (error) {
        console.error('Logout error:', error);
        alert('Could not sign out: ' + error.message);

    } finally {
        logoutBtn.disabled = false;
    }
});

// ------------------------------------
// ADD RECORD (COMING SOON)
// ------------------------------------

const addRecordBtn = document.getElementById('addRecordBtn');

if (addRecordBtn) {
    addRecordBtn.addEventListener('click', () => {
        alert('Coming soon! Add your first personal record.');
    });
}

console.log('PR Tracker initialized successfully 💪');
