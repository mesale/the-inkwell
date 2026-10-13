<#import "template.ftl" as layout>

<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The Inkwell | Sign In</title>

    <link rel="stylesheet" href="${url.resourcesPath}/css/login.css" />

    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>

    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
</head>

<body>

<main class="login-container">

    <!-- LEFT PANEL -->
    <div class="login-visual">

        <div class="visual-overlay"></div>

        <img
            class="visual-image"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgDseiGw6VUKAzbraGb8HShCZOPTviamjCmPdoIw_Jt0HjC_FY9E5cTW-lxVSso4sF32ZEeVerV9VogeS2f4dneBpjI2BYHTg77YXBJWe6KqcdjtOtieOPdGtAQqyVim2PZ_eBAhi2tiiU_BAfFdz8f_F6-oL9is1dClT9vMeH3-ausJjQ_juhLF0M-HeA3QR28mO687XOvvqf5D6XPxIaf0pskBUB2LaBK4W-PMSy_uQPTA2YbB9WnQFvUf31S0MImp-kPeJBvz8"
            alt="Books Background"
        />

        <div class="visual-content">
            <h1 class="brand-title">onlinebookstore</h1>

            <p class="brand-subtitle">
                "Your marketplace for buying and selling books across Ethiopia."
            </p>
        </div>

        <div class="visual-circle"></div>

    </div>

    <!-- RIGHT PANEL -->
    <div class="login-form-wrapper">

        <!-- MOBILE LOGO -->
        <div class="mobile-logo">
            onlinebookstore
        </div>

        <div class="form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue to your account.</p>
        </div>

        <!-- ERROR -->
        <#if message?has_content && message.type = "error">
            <div class="rb-alert-error">
                ⚠ ${message.summary}
            </div>
        </#if>

        <form action="${url.loginAction}" method="post" class="login-form">

            <input
                type="hidden"
                name="credentialId"
                value="${(auth.selectedCredential)!''}"
            />

            <!-- USERNAME -->
            <div class="field-group">

                <label for="username">
                    ${msg("usernameOrEmail")}
                </label>

                <div class="input-wrapper">

                    <input
                        id="username"
                        name="username"
                        type="text"
                        autofocus
                        autocomplete="username"
                        value="${(login.username)!''}"
                        placeholder="reader@onlinebookstore.com"
                        required
                    />

                    <span class="material-symbols-outlined">
                        mail
                    </span>

                </div>

            </div>

            <!-- PASSWORD -->
            <div class="field-group">

                <div class="label-row">

                    <label for="password">
                        ${msg("password")}
                    </label>

                    <#if realm.resetPasswordAllowed>
                        <a
                            class="forgot-link"
                            href="${url.loginResetCredentialsUrl}"
                        >
                            Forgot Password?
                        </a>
                    </#if>

                </div>

                <div class="input-wrapper">

                    <input
                        id="password"
                        name="password"
                        type="password"
                        autocomplete="current-password"
                        placeholder="••••••••"
                        required
                    />

                    <span class="material-symbols-outlined">
                        lock
                    </span>

                </div>

            </div>

            <!-- REMEMBER ME -->
            <div class="remember-row">

                <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                />

                <label for="rememberMe">
                    Keep me signed in
                </label>

            </div>

            <!-- SUBMIT -->
            <button class="login-btn" type="submit">
                Sign In
            </button>

        </form>

        <!-- REGISTER -->
        <#if realm.registrationAllowed>
            <div class="register-link">
                New to onlinebookstore?
                <a href="${url.registrationUrl}">
                    Create an account
                </a>
            </div>
        </#if>

    </div>

</main>

<footer class="footer-branding">
    © 2026 onlinebookstore ecosystem
</footer>

</body>
</html>
