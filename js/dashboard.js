document.addEventListener('DOMContentLoaded', async () => {

    // ======================================================
    // Configuração do Supabase (Mesmas chaves novamente)
    // ======================================================
    const SUPABASE_URL = 'https://qxkmlwpbkvuqnmlczutf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4a21sd3Bia3Z1cW5tbGN6dXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDM2OTgsImV4cCI6MjA3NjcxOTY5OH0.d7NU19UdzheUxrNhkhsjtqpa8Yhl3Oo8jSjNX5t2xzY';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    // ======================================================

    // Seleciona o elemento onde mostraremos as informações
    const userProfileDisplay = document.getElementById('userProfileDisplay');
    // =============================================
    // INÍCIO: CÓDIGO NOVO (Seleciona o dropdown)
    // =============================================
    const profileDropdown = document.getElementById('profileDropdown');
    // =============================================
    // FIM: CÓDIGO NOVO
    // =============================================

    // Função para buscar dados do usuário e atualizar a UI
    async function loadUserProfile() {
        try {
            // 1. Pega os dados da sessão ATUAL (usuário logado)
            const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

            if (sessionError) throw sessionError;

            if (session && session.user) {
                const user = session.user;
                console.log('Usuário logado:', user);
                const userEmail = user.email; // Pega o email diretamente do Auth

                // 2. Busca o perfil (nome, etc.) na tabela 'cadastros' usando o user.id
                // ATENÇÃO: 'cadastros' deve ser o nome da sua tabela
                const { data: profileData, error: profileError } = await _supabase
                    .from('cadastros') // <-- Nome da sua tabela
                    .select('nome') // Pega apenas a coluna 'nome'
                    .eq('user_id', user.id) // Onde 'user_id' é igual ao ID do usuário logado
                    .single(); // Espera apenas um resultado

                if (profileError && profileError.code !== 'PGRST116') { 
                    // Ignora o erro 'PGRST116' (nenhuma linha encontrada), mas trata outros erros
                    throw profileError;
                }
                
                let userName = "Usuário"; // Nome padrão
                if (profileData && profileData.nome) {
                    userName = profileData.nome; // Usa o nome do perfil se encontrado
                }

                // 3. Atualiza o HTML do user-profile
                // Exemplo simples: Mostra as iniciais e o email como 'title' (tooltip)
                const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                userProfileDisplay.innerHTML = `
                    <span title="${userEmail}">${initials}</span> 
                `;
                // Aplica um estilo básico para as iniciais ficarem visíveis
                userProfileDisplay.style.backgroundColor = '#4B5563'; // Cor cinza do tema
                userProfileDisplay.style.color = '#F9FAFB'; // Texto branco
                userProfileDisplay.style.display = 'flex';
                userProfileDisplay.style.alignItems = 'center';
                userProfileDisplay.style.justifyContent = 'center';
                userProfileDisplay.style.fontWeight = 'bold';
                userProfileDisplay.style.fontSize = '0.9rem';


            } else {
                // Não há usuário logado, redireciona para o login
                console.log('Nenhum usuário logado, redirecionando para login...');
                window.location.href = 'login.html'; 
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error.message);
            // Em caso de erro, também redireciona para login para segurança
            alert('Erro ao carregar seus dados. Por favor, faça login novamente.');
            window.location.href = 'login.html';
        }
    }

    // Chama a função para carregar os dados quando a página carregar
    loadUserProfile();

    // =============================================
    // INÍCIO: CÓDIGO NOVO (Lógica para mostrar/esconder dropdown)
    // =============================================
    if (userProfileDisplay && profileDropdown) {
        userProfileDisplay.addEventListener('click', (event) => {
            event.stopPropagation(); // Impede que o clique feche o menu imediatamente
            profileDropdown.classList.toggle('show');
        });

        // Fecha o dropdown se clicar fora dele
        window.addEventListener('click', (event) => {
            if (!userProfileDisplay.contains(event.target) && !profileDropdown.contains(event.target)) {
                if (profileDropdown.classList.contains('show')) {
                    profileDropdown.classList.remove('show');
                }
            }
        });
    }
    // =============================================
    // FIM: CÓDIGO NOVO
    // =============================================

});