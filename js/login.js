document.addEventListener('DOMContentLoaded', () => {

    // ======================================================
    // Configuração do Supabase (Mesmas chaves)
    // ======================================================
    const SUPABASE_URL = 'https://qxkmlwpbkvuqnmlczutf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4a21sd3Bia3Z1cW5tbGN6dXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDM2OTgsImV4cCI6MjA3NjcxOTY5OH0.d7NU19UdzheUxrNhkhsjtqpa8Yhl3Oo8jSjNX5t2xzY';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    // ======================================================

    // 1. Seleciona os elementos
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password'); // Agora vamos usar!
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');

    // 2. Adiciona o "ouvinte" de envio do formulário
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const email = emailInput.value;
        const password = passwordInput.value; // Pega a senha

        // 3. Validação
        if (email.trim() === '' || password.trim() === '') {
            alert('Por favor, preencha email e senha.');
            return;
        }

        // 4. Mostra feedback de carregamento
        loginButtonText.textContent = 'Acessando...';
        loginButton.disabled = true;

        try {
            // 5. Tenta fazer o login com 'auth'
            const { data, error } = await _supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error; // Joga o erro para o catch

            // SUCESSO!
            console.log('Login bem-sucedido:', data.user);
            alert('Login bem-sucedido! Redirecionando...');
            
            // Redireciona para o dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            // FALHA!
            console.error('Erro no login:', error.message);
            alert('Email ou senha inválidos. Por favor, tente novamente.');
            
            // Reativa o botão
            loginButtonText.textContent = 'Acessar sua conta';
            loginButton.disabled = false;
        }
    });
});