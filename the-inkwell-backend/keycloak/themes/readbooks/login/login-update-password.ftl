<#import "template.ftl" as layout>

<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The Inkwell | Update Password</title>

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
            <h2>Update Password</h2>
            <p>Please enter your new password below.</p>
        </div>

        <!-- ERROR/SUCCESS MESSAGES -->
        <#if message?has_content>
            <#if message.type = "error">
                <div class="rb-alert-error">
                    ⚠ ${message.summary}
                </div>
            <#elseif message.type = "success">
                <div class="rb-alert-success" style="color: green; margin-bottom: 1rem; padding: 1rem; background: rgba(0, 255, 0, 0.1); border-radius: 8px;">
                    ✓ ${message.summary}
                </div>
            </#if>
        </#if>

        <form action="${url.loginAction}" method="post" class="login-form">
            
            <input type="text" id="username" name="username" value="${username!''}" autocomplete="username" readonly="readonly" style="display:none;"/>
            <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;"/>

            <!-- NEW PASSWORD -->
            <div class="field-group">
                <label for="password-new">
                    New Password
                </label>
                <div class="input-wrapper">
                    <input
                        id="password-new"
                        name="password-new"
                        type="password"
                        autofocus
                        autocomplete="new-password"
                        placeholder="••••••••"
                        required
                    />
                    <span class="material-symbols-outlined">
                        lock
                    </span>
                </div>
            </div>

            <!-- CONFIRM PASSWORD -->
            <div class="field-group">
                <label for="password-confirm">
                    Confirm Password
                </label>
                <div class="input-wrapper">
                    <input
                        id="password-confirm"
                        name="password-confirm"
                        type="password"
                        autocomplete="new-password"
                        placeholder="••••••••"
                        required
                    />
                    <span class="material-symbols-outlined">
                        lock
                    </span>
                </div>
            </div>

            <!-- SUBMIT -->
            <button class="login-btn" type="submit">
                Update Password
            </button>

        </form>

    </div>

</main>

<footer class="footer-branding">
    © 2026 onlinebookstore ecosystem
</footer>

</body>
</html>
