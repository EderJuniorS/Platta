// Caminho: js/produtos.js

document.addEventListener('DOMContentLoaded', () => {
    // === CONFIGURAÇÃO SUPABASE ===
    const SUPABASE_URL = 'https://qxkmlwpbkvuqnmlczutf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4a21sd3Bia3Z1cW5tbGN6dXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDM2OTgsImV4cCI6MjA3NjcxOTY5OH0.d7NU19UdzheUxrNhkhsjtqpa8Yhl3Oo8jSjNX5t2xzY';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // === SELETORES DO DOM ===
    const addProductBtn = document.querySelector('.btn-add-product');
    const modalOverlay = document.getElementById('product-modal-overlay');
    const cancelBtn = document.getElementById('btn-cancel-product');
    const productForm = document.getElementById('add-product-form');
    const saveBtn = document.getElementById('btn-save-product');
    const tableBody = document.querySelector('.table-container tbody');

    // === FUNÇÕES DO MODAL ===
    const openModal = () => modalOverlay.style.display = 'flex';
    const closeModal = () => {
        modalOverlay.style.display = 'none';
        productForm.reset(); 
        descriptionInput.dispatchEvent(new Event('input')); 
    };

    if(addProductBtn) addProductBtn.addEventListener('click', openModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if(modalOverlay) modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // === LÓGICA DE FORMATAÇÃO DE PREÇO (MÁSCARA) ===
    const priceInput = document.getElementById('product-price');
    if(priceInput) {
        priceInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); 
            if (value === '') { e.target.value = ''; return; }
            value = value.padStart(3, '0'); 
            const reais = value.slice(0, -2);
            const centavos = value.slice(-2);
            const reaisFormatado = parseInt(reais, 10).toLocaleString('pt-BR');
            e.target.value = `${reaisFormatado},${centavos}`;
        });
    }
    
    // === LÓGICA DE CONTADOR DE CARACTERES ===
    const descriptionInput = document.getElementById('product-description');
    const charCounter = document.querySelector('.char-counter');
    if(descriptionInput && charCounter) {
        descriptionInput.addEventListener('input', () => {
            charCounter.textContent = `${descriptionInput.value.length}/100`;
        });
    }

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

    // === FUNÇÃO PRINCIPAL PARA CARREGAR PRODUTOS ===
    async function loadProducts() {
        if (!tableBody) return; 

        try {
            // 1. Pega o usuário logado
            const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
            if (sessionError || !session) {
                console.error("Usuário não logado, não é possível carregar produtos.");
                return;
            }
            const user = session.user;

            // 2. Busca os produtos do usuário no banco
            const { data: products, error } = await _supabase
                .from('products')
                .select('*') 
                .eq('user_id', user.id) 
                .order('created_at', { ascending: false }); 

            if (error) throw error;

            // 3. Limpa a tabela
            tableBody.innerHTML = '';

            // 4. Verifica se está vazia
            if (products.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Nenhum produto encontrado.</td></tr>';
                return;
            }

            // 5. Renderiza cada produto na tabela
            products.forEach(product => {
                const newRow = document.createElement('tr');
                
                // ATUALIZAÇÃO AQUI: Adiciona o HTML do dropdown
                // --- CÓDIGO ATUALIZADO ---
                newRow.innerHTML = `
                    <td>${product.name}</td>
                    <td>${formatAsBRL(product.price_in_cents)}</td>
                    <td><span class="status-badge status-active">${product.status}</span></td>
                    <td class="actions-menu">
                        <i class="fas fa-ellipsis-h actions-button" data-product-id="${product.id}"></i>
                        
                        <div class="actions-dropdown" id="menu-${product.id}">
                            <a href="links.html?product_id=${product.id}">
                                <i class="fas fa-link"></i> Ver links
                            </a>
                            <a href="editar-produto.html?product_id=${product.id}">
                                <i class="fas fa-edit"></i> Editar
                            </a>
                        </div>
                    </td>
                `;
                tableBody.appendChild(newRow);
            });

        } catch (error) {
            console.error('Erro ao carregar produtos:', error.message);
            tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Erro ao carregar produtos.</td></tr>';
        }
    }

    // ======================================================
    // == INÍCIO: NOVA LÓGICA PARA ABRIR/FECHAR DROPDOWN ==
    // ======================================================

    // Fecha todos os menus dropdown abertos
    function closeAllDropdowns() {
        document.querySelectorAll('.actions-dropdown.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    // Adiciona o "ouvinte" na tabela inteira (delegação de eventos)
    if(tableBody) {
        tableBody.addEventListener('click', (e) => {
            // Verifica se o clique foi no botão de 3 pontinhos
            if (e.target.classList.contains('actions-button')) {
                e.stopPropagation(); // Impede o clique de fechar o menu (ver abaixo)
                
                const productId = e.target.dataset.productId;
                const menu = document.getElementById(`menu-${productId}`);
                
                if (!menu) return;

                // Se o menu já estiver aberto, fecha. Senão, fecha os outros e abre este.
                const isAlreadyOpen = menu.classList.contains('show');
                closeAllDropdowns();
                if (!isAlreadyOpen) {
                    menu.classList.add('show');
                }
            }
            // (Opcional) Adicione lógica para "Ver links" e "Editar" aqui
            // else if (e.target.closest('a')?.textContent.includes('Editar')) {
            //    alert('Clicou em Editar!');
            // }
        });
    }

    // Fecha os menus se clicar em qualquer outro lugar da página
    window.addEventListener('click', () => {
        closeAllDropdowns();
    });

    // ======================================================
    // == FIM: NOVA LÓGICA DROPDOWN
    // ======================================================


    // === LÓGICA DE SALVAR PRODUTO ===
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvando...';

            try {
                // ... (O resto desta função continua EXATAMENTE IGUAL) ...
                
                // 1. Obter o usuário logado
                const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
                if (sessionError || !session) {
                    throw new Error('Usuário não autenticado. Faça login novamente.');
                }
                const user = session.user;

                // 2. Pegar dados do formulário
                const formData = new FormData(productForm);
                
                // 3. Converter preço para centavos
                const priceString = formData.get('price') || '0,00';
                const priceInCents = parseInt(priceString.replace(/[R$\.]/g, '').replace(',', ''), 10);
                
                if (isNaN(priceInCents) || priceInCents <= 0) {
                   throw new Error('O preço deve ser um valor válido e maior que zero.');
                }

                // 4. Montar o objeto para o Supabase
                const newProduct = {
                    user_id: user.id, 
                    name: formData.get('name'),
                    description: formData.get('description'),
                    price_in_cents: priceInCents,
                    sales_page_url: formData.get('sales-page') || null,
                    payment_type: formData.get('payment-type')
                };
                
                // 5. Inserir no banco de dados
                const { error: insertError } = await _supabase
                    .from('products')
                    .insert(newProduct);
                
                if (insertError) {
                    console.error('Erro do Supabase:', insertError);
                    throw new Error(`Erro ao salvar produto: ${insertError.message}`);
                }
                
                // 6. Sucesso
                alert('Produto adicionado com sucesso!');
                closeModal();
                
                // 7. Recarrega a tabela para mostrar o novo produto
                loadProducts(); 

            } catch (error) {
                console.error('Erro:', error.message);
                alert(error.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Continuar';
            }
        });
    }

    // --- EXECUÇÃO INICIAL ---
    loadProducts();
});