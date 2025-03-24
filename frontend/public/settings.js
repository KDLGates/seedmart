document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('seedmart_token');
    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = '/login.html';
        return;
    }

    // Setup navigation
    setupNavigation();
    
    // Initialize UI components
    initializePasswordStrength();
    initializePasswordToggles();
    loadUserData();
    loadUserPreferences();

    // Form submissions
    setupFormSubmissions();

    // Update auth section
    updateAuthSection();
});

// Setup tab navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.settings-nav a');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links and tabs
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Show corresponding tab
            const tabId = link.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize password strength indicator
function initializePasswordStrength() {
    const passwordInput = document.getElementById('new-password');
    if (!passwordInput) return;
    
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.password-strength-text');
    
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        let strength = 0;
        let status = '';
        
        if (password.length >= 8) strength += 1;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
        if (password.match(/\d/)) strength += 1;
        if (password.match(/[^a-zA-Z\d]/)) strength += 1;
        
        strengthBar.className = 'strength-bar';
        
        switch (strength) {
            case 0:
                strengthBar.classList.add('weak');
                status = 'Weak';
                break;
            case 1:
            case 2:
                strengthBar.classList.add('medium');
                status = 'Medium';
                break;
            case 3:
            case 4:
                strengthBar.classList.add('strong');
                status = 'Strong';
                break;
        }
        
        if (password.length === 0) {
            strengthText.textContent = '';
        } else {
            strengthText.textContent = `Password strength: ${status}`;
        }
    });
}

// Initialize password toggle visibility buttons
function initializePasswordToggles() {
    const toggles = document.querySelectorAll('.toggle-password');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const inputId = toggle.id.replace('toggle-', '');
            const passwordInput = document.getElementById(inputId);
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggle.classList.remove('fa-eye-slash');
                toggle.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                toggle.classList.remove('fa-eye');
                toggle.classList.add('fa-eye-slash');
            }
        });
    });
}

// Load user data from API
async function loadUserData() {
    const token = localStorage.getItem('seedmart_token');
    if (!token) return;
    
    try {
        showLoader();
        
        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired
                localStorage.removeItem('seedmart_token');
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        
        // Populate form fields
        document.getElementById('username').value = userData.username || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('first-name').value = userData.first_name || '';
        document.getElementById('last-name').value = userData.last_name || '';
        if (userData.bio) {
            document.getElementById('bio').value = userData.bio;
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Error loading user data', 'error');
    } finally {
        hideLoader();
    }
}

// Load user preferences from localStorage
function loadUserPreferences() {
    // Theme preference
    const theme = localStorage.getItem('seedmart_theme') || 'dark';
    document.getElementById(`theme-${theme}`).checked = true;
    
    // Chart color preference
    const chartColor = localStorage.getItem('seedmart_chart_color') || 'blue';
    document.getElementById(`color-${chartColor}`).checked = true;
    
    // Timeframe preference
    const defaultTimeframe = localStorage.getItem('seedmart_default_timeframe') || '1w';
    document.getElementById('default-timeframe').value = defaultTimeframe;
    
    // Data source preference
    const dataSource = localStorage.getItem('seedmart_data_source') || 'api';
    document.getElementById('data-source').value = dataSource;
    
    // Auto-refresh preference
    const autoRefresh = localStorage.getItem('seedmart_auto_refresh') !== 'false';
    document.getElementById('auto-refresh').checked = autoRefresh;
    
    // Notification preferences
    const emailNotifications = localStorage.getItem('seedmart_email_notifications') !== 'false';
    document.getElementById('email-notifications').checked = emailNotifications;
    
    const priceAlerts = localStorage.getItem('seedmart_price_alerts') !== 'false';
    document.getElementById('price-alerts').checked = priceAlerts;
    
    const tradeConfirmations = localStorage.getItem('seedmart_trade_confirmations') !== 'false';
    document.getElementById('trade-confirmations').checked = tradeConfirmations;
    
    const marketNews = localStorage.getItem('seedmart_market_news') !== 'false';
    document.getElementById('market-news').checked = marketNews;
}

// Setup all form submissions
function setupFormSubmissions() {
    // Account form
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                email: document.getElementById('email').value,
                first_name: document.getElementById('first-name').value,
                last_name: document.getElementById('last-name').value,
                bio: document.getElementById('bio').value
            };
            
            try {
                const token = localStorage.getItem('seedmart_token');
                if (!token) return;
                
                showLoader();
                
                const response = await fetch(`${API_URL}/users/me`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to update account');
                }
                
                // Show success message
                const successEl = document.getElementById('account-success');
                const successText = document.getElementById('account-success-text');
                successText.textContent = 'Account updated successfully';
                successEl.style.display = 'flex';
                
                // Hide error message if showing
                document.getElementById('account-error').style.display = 'none';
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    successEl.style.display = 'none';
                }, 5000);
                
                showToast('Account updated successfully', 'success');
                
            } catch (error) {
                console.error('Error updating account:', error);
                
                // Show error message
                const errorEl = document.getElementById('account-error');
                const errorText = document.getElementById('account-error-text');
                errorText.textContent = error.message || 'Failed to update account';
                errorEl.style.display = 'flex';
                
                // Hide success message if showing
                document.getElementById('account-success').style.display = 'none';
                
                showToast(error.message || 'Failed to update account', 'error');
            } finally {
                hideLoader();
            }
        });
    }
    
    // Password form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Validate passwords
            if (newPassword !== confirmPassword) {
                const errorEl = document.getElementById('password-error');
                const errorText = document.getElementById('password-error-text');
                errorText.textContent = 'Passwords do not match';
                errorEl.style.display = 'flex';
                return;
            }
            
            // Validate password strength
            if (newPassword.length < 8) {
                const errorEl = document.getElementById('password-error');
                const errorText = document.getElementById('password-error-text');
                errorText.textContent = 'Password must be at least 8 characters long';
                errorEl.style.display = 'flex';
                return;
            }
            
            try {
                const token = localStorage.getItem('seedmart_token');
                if (!token) return;
                
                showLoader();
                
                const response = await fetch(`${API_URL}/users/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to update password');
                }
                
                // Show success message
                const successEl = document.getElementById('password-success');
                const successText = document.getElementById('password-success-text');
                successText.textContent = 'Password updated successfully';
                successEl.style.display = 'flex';
                
                // Hide error message if showing
                document.getElementById('password-error').style.display = 'none';
                
                // Reset form
                passwordForm.reset();
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    successEl.style.display = 'none';
                }, 5000);
                
                showToast('Password updated successfully', 'success');
                
            } catch (error) {
                console.error('Error updating password:', error);
                
                // Show error message
                const errorEl = document.getElementById('password-error');
                const errorText = document.getElementById('password-error-text');
                errorText.textContent = error.message || 'Failed to update password';
                errorEl.style.display = 'flex';
                
                // Hide success message if showing
                document.getElementById('password-success').style.display = 'none';
                
                showToast(error.message || 'Failed to update password', 'error');
            } finally {
                hideLoader();
            }
        });
    }
    
    // Notification form
    const notificationForm = document.getElementById('notification-form');
    if (notificationForm) {
        notificationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Save notification preferences to localStorage
            localStorage.setItem('seedmart_email_notifications', document.getElementById('email-notifications').checked);
            localStorage.setItem('seedmart_price_alerts', document.getElementById('price-alerts').checked);
            localStorage.setItem('seedmart_trade_confirmations', document.getElementById('trade-confirmations').checked);
            localStorage.setItem('seedmart_market_news', document.getElementById('market-news').checked);
            
            // Show success message
            const successEl = document.getElementById('notification-success');
            const successText = document.getElementById('notification-success-text');
            successText.textContent = 'Notification preferences saved';
            successEl.style.display = 'flex';
            
            // Hide error message if showing
            document.getElementById('notification-error').style.display = 'none';
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 5000);
            
            showToast('Notification preferences saved', 'success');
        });
    }
    
    // Appearance form
    const appearanceForm = document.getElementById('appearance-form');
    if (appearanceForm) {
        appearanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get selected theme
            const theme = document.querySelector('input[name="theme"]:checked').value;
            localStorage.setItem('seedmart_theme', theme);
            
            // Get selected chart color
            const chartColor = document.querySelector('input[name="chart_color"]:checked').value;
            localStorage.setItem('seedmart_chart_color', chartColor);
            
            // Apply theme changes (in a real app, this would update CSS variables)
            document.body.className = theme === 'light' ? 'light-theme' : '';
            
            // Show success message
            const successEl = document.getElementById('appearance-success');
            const successText = document.getElementById('appearance-success-text');
            successText.textContent = 'Appearance preferences saved';
            successEl.style.display = 'flex';
            
            // Hide error message if showing
            document.getElementById('appearance-error').style.display = 'none';
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 5000);
            
            showToast('Appearance preferences saved', 'success');
        });
    }
    
    // Preferences form
    const preferencesForm = document.getElementById('preferences-form');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Save preferences to localStorage
            localStorage.setItem('seedmart_default_timeframe', document.getElementById('default-timeframe').value);
            localStorage.setItem('seedmart_data_source', document.getElementById('data-source').value);
            localStorage.setItem('seedmart_auto_refresh', document.getElementById('auto-refresh').checked);
            
            // Show success message
            const successEl = document.getElementById('preferences-success');
            const successText = document.getElementById('preferences-success-text');
            successText.textContent = 'Trading preferences saved';
            successEl.style.display = 'flex';
            
            // Hide error message if showing
            document.getElementById('preferences-error').style.display = 'none';
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 5000);
            
            showToast('Trading preferences saved', 'success');
        });
    }
}

// Show loader while loading
function showLoader() {
    // Check if loader exists, if not create it
    let loader = document.querySelector('.settings-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'settings-loader';
        loader.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
        document.querySelector('.settings-container').appendChild(loader);
    }
    loader.style.display = 'flex';
}

// Hide loader
function hideLoader() {
    const loader = document.querySelector('.settings-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add close button event
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toastContainer.contains(toast)) {
            toast.classList.add('toast-fade-out');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }
    }, 5000);
}

// Update auth section with user info
function updateAuthSection() {
    const token = localStorage.getItem('seedmart_token');
    if (!token) return;
    
    try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('seedmart_user'));
        if (!userData) return;
        
        const authSection = document.getElementById('auth-section');
        
        // Generate initials for avatar
        const initials = (userData.first_name && userData.last_name) ?
            (userData.first_name.charAt(0) + userData.last_name.charAt(0)).toUpperCase() :
            userData.username.substring(0, 2).toUpperCase();
        
        authSection.innerHTML = `
            <div class="user-avatar">${initials}</div>
            <span class="user-name">${userData.username}</span>
            <i class="fas fa-chevron-down dropdown-icon"></i>
            <div class="user-dropdown" id="user-dropdown">
                <ul>
                    <li><a href="/profile.html" title="View your profile"><i class="fas fa-user"></i> Profile</a></li>
                    <li><a href="/portfolio.html" title="View your seed portfolio"><i class="fas fa-seedling"></i> Portfolio</a></li>
                    <li><a href="/settings.html" title="Account settings" class="active"><i class="fas fa-cog"></i> Settings</a></li>
                    <li><a href="#" id="logout-btn" class="logout-btn" title="Log out"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                </ul>
            </div>
        `;
        
        // Add event listeners
        const avatar = authSection.querySelector('.user-avatar');
        const userName = authSection.querySelector('.user-name');
        const dropdownIcon = authSection.querySelector('.dropdown-icon');
        const dropdown = authSection.querySelector('.user-dropdown');
        
        // Toggle dropdown on click
        [avatar, userName, dropdownIcon].forEach(el => {
            el.addEventListener('click', () => {
                dropdown.classList.toggle('active');
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!authSection.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Clear token and user data
                localStorage.removeItem('seedmart_token');
                localStorage.removeItem('seedmart_user');
                
                // Redirect to home
                window.location.href = '/';
            });
        }
        
    } catch (error) {
        console.error('Error updating auth section:', error);
    }
}
