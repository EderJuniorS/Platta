// Caminho: js/links.js

document.addEventListener('DOMContentLoaded', async () => {
    // === CONFIGURAÇÃO SUPABASE ===
    const SUPABASE_URL = 'https://qxkmlwpbkvuqnmlczutf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4a21sd3Bia3Z1cW5tbGN6dXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDM2OTgsImV4cCI6MjA3NjcxOTY5OH0.d7NU19UdzheUxrNhkhsjtqpa8Yhl3Oo8jSjNX5t2xzY';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // === SELETORES DO DOM ===
    const tableBody = document.getElementById('links-table-body');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_id');

    // === FUNÇÃO HELPER DE PREÇO (BRL) ===
    function formatAsBRL(cents) {
        if (typeof cents !== 'number') {
            cents = parseInt(cents, 10) || 0;
        }
        const reais = (cents / 100);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(reais);
    }

    // === FUNÇÃO PRINCIPAL PARA CARREGAR DADOS ===
    async function loadLinkData(productId) {
        if (!productId) {
            tableBody.innerHTML = '<tr><td colspan="8" class="no-data">Erro: Produto não especificado.</td></tr>';
            return;
        }

        try {
            // VERIFICA SE O USUÁRIO ESTÁ LOGADO (Necessário pelas regras de RLS)
            const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
            if (sessionError || !session) {
                // Redireciona para o login se não estiver logado
                window.location.href = 'login.html';
                return;
            }

            // 1. Busca os dados do produto (Oferta e Preço)
            // (A Política de SELECT 'Qualquer pessoa pode ver os produtos' permite isso)
            const { data: product, error } = await _supabase
                .from('products')
                .select('name, price_in_cents')
                .eq('id', productId)
                .eq('user_id', session.user.id) // Garante que o usuário só veja seus próprios produtos
                .single(); 

            if (error) throw error;
            if (!product) throw new Error('Produto não encontrado ou não pertence a você.');

            // 2. Prepara os dados da tabela
            const linkName = "Link para checkout Checkout Principal";
            // (Criando o link de checkout real para seu projeto "Platta")
            const linkUrl = `checkout.html?product_id=${productId}`; // Aponta para seu checkout.html
            const linkOferta = product.name;
            const linkTipo = "Checkout";
            const linkPreco = formatAsBRL(product.price_in_cents);
            const linkStatus = "Ativo";

            // 3. Limpa a tabela
            tableBody.innerHTML = '';

            // 4. Cria e insere a nova linha na tabela
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="checkbox"></td>
                <td>${linkName}</td>
                <td>
                    <div class="url-cell">
                        <span>checkout.html?product_id=...</span>
                        <i class="fas fa-copy" onclick="navigator.clipboard.writeText('${window.location.origin}/${linkUrl}')"></i>
                    </div>
                </td>
                <td>${linkOferta}</td>
                <td><span class="badge-checkout">${linkTipo}</span></td>
                <td>${linkPreco}</td>
                <td><span class="status-badge status-active">${linkStatus}</span></td>
                <td class="actions-menu">
                    <i class="fas fa-ellipsis-h"></i>
                </td>
            `;
            tableBody.appendChild(newRow);
            
            // Adiciona funcionalidade de copiar ao ícone
            tableBody.querySelector('.fa-copy').addEventListener('click', () => {
                alert('Link de checkout copiado para a área de transferência!');
            });


        } catch (error) {
            console.error('Erro ao carregar links:', error.message);
            tableBody.innerHTML = `<tr><td colspan="8" class="no-data">Erro ao carregar dados: ${error.message}</td></tr>`;
        }
    }

    // --- EXECUÇÃO INICIAL ---
    loadLinkData(productId);
});