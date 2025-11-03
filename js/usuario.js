document.addEventListener('DOMContentLoaded', async () => {

    // ======================================================
    // Configuração do Supabase (Mesmas chaves)
    // ======================================================
    const SUPABASE_URL = 'https://qxkmlwpbkvuqnmlczutf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4a21sd3Bia3Z1cW5tbGN6dXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDM2OTgsImV4cCI6MjA3NjcxOTY5OH0.d7NU19UdzheUxrNhkhsjtqpa8Yhl3Oo8jSjNX5t2xzY';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    // ======================================================

    // Seleciona os elementos do card de perfil
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const verificationStatusElement = document.getElementById('verificationStatus'); 
    const userDocumentElement = document.getElementById('userDocument');
    const userPhoneElement = document.getElementById('userPhone');
    const userLanguageElement = document.getElementById('userLanguage'); 
    
    // Seleciona os elementos do header (para o ícone e dropdown)
    const userProfileDisplay = document.getElementById('userProfileDisplay');
    const profileDropdown = document.getElementById('profileDropdown');

    async function loadUserData() {
        try {
            // 1. Pega a sessão do usuário logado
            const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

            if (sessionError) throw sessionError;

            if (session && session.user) {
                const user = session.user;
                const userEmail = user.email;

                // 2. Busca os dados do perfil na tabela 'cadastros'
                const { data: profileData, error: profileError } = await _supabase
                    .from('cadastros') 
                    .select('*') 
                    .eq('user_id', user.id) 
                    .single(); 

                if (profileError && profileError.code !== 'PGRST116') {
                    throw profileError;
                }

                // 3. Preenche os elementos HTML do CARD DE PERFIL
                const profileName = profileData?.nome || 'Usuário'; // Usa 'nome' ou um fallback
                userNameElement.textContent = profileName; 
                userEmailElement.textContent = maskEmail(userEmail); 
                userDocumentElement.textContent = profileData?.documento || '---';
                userPhoneElement.textContent = formatDisplayPhone(profileData?.celular); 
                verificationStatusElement.innerHTML = 'Dados verificados <i class="fas fa-info-circle"></i>';
                userLanguageElement.textContent = 'Português (BR)';

                // 4. ATUALIZA O ÍCONE NO HEADER (copiado do dashboard.js)
                if (userProfileDisplay) {
                    const initials = profileName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    userProfileDisplay.innerHTML = `<span title="${userEmail}">${initials}</span>`;
                    // Estilos básicos (podem ser movidos para CSS se preferir)
                    userProfileDisplay.style.backgroundColor = '#4B5563'; 
                    userProfileDisplay.style.color = '#F9FAFB'; 
                    userProfileDisplay.style.display = 'flex';
                    userProfileDisplay.style.alignItems = 'center';
                    userProfileDisplay.style.justifyContent = 'center';
                    userProfileDisplay.style.fontWeight = 'bold';
                    userProfileDisplay.style.fontSize = '0.9rem';
                }

            } else {
                // Se não houver sessão, volta para o login
                console.log('Nenhum usuário logado, redirecionando...');
                window.location.href = 'login.html';
            }

        } catch (error) {
            console.error('Erro ao carregar dados do perfil:', error.message);
            alert('Erro ao carregar seu perfil. Faça login novamente.');
            window.location.href = 'login.html';
        }
    }

    // Função para mascarar o email 
    function maskEmail(email) {
       // ... (código igual ao anterior) ...
        if (!email || !email.includes('@')) return email || '---'; 
        const [localPart, domain] = email.split('@');
        if (localPart.length <= 4) return email; 
        const maskedLocal = localPart.substring(0, 4) + '*'.repeat(localPart.length - 4);
        return `${maskedLocal}@${domain}`;
    }

    // Função para formatar o telefone
    function formatDisplayPhone(phone) {
       // ... (código igual ao anterior) ...
        if (!phone) return '---';
        const digits = phone.replace(/\D/g, ''); 
        if (digits.length === 11) {
            return `+55 ${digits.substring(0, 2)} ${digits.substring(2, 7)}-${digits.substring(7)}`;
        } else if (digits.length === 10) {
             return `+55 ${digits.substring(0, 2)} ${digits.substring(2, 6)}-${digits.substring(6)}`;
        }
        return phone; 
    }

    // Chama a função para carregar os dados
    loadUserData();

    // ADICIONADO: Lógica para mostrar/esconder dropdown (copiado do dashboard.js)
    if (userProfileDisplay && profileDropdown) {
        userProfileDisplay.addEventListener('click', (event) => {
            event.stopPropagation(); 
            profileDropdown.classList.toggle('show');
        });

        window.addEventListener('click', (event) => {
            if (!userProfileDisplay.contains(event.target) && !profileDropdown.contains(event.target)) {
                if (profileDropdown.classList.contains('show')) {
                    profileDropdown.classList.remove('show');
                }
            }
        });
    }

});