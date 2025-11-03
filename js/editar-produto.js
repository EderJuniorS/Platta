// Caminho: js/editar-produto.js

document.addEventListener('DOMContentLoaded', async () => {
    // === CONFIGURAÇÃO SUPABASE ===
    const SUPABASE_URL = 'https://qxkmlwpbkvuqnmlczutf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4a21sd3Bia3Z1cW5tbGN6dXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDM2OTgsImV4cCI6MjA3NjcxOTY5OH0.d7NU19UdzheUxrNhkhsjtqpa8Yhl3Oo8jSjNX5t2xzY';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // === SELETORES DO DOM ===
    const form = document.getElementById('edit-product-form');
    const saveButton = document.getElementById('save-product-button');
    const deleteButton = document.getElementById('delete-product-button');
    const linksTabLink = document.getElementById('links-tab-link');
    
    // Campos do formulário Geral
    const nameInput = document.getElementById('product-name');
    const descriptionInput = document.getElementById('product-description');
    const categoryInput = document.getElementById('product-category');
    
    // Campos de Imagem
    const imageUploader = document.getElementById('image-uploader');
    const imageUploadInput = document.getElementById('product-image-upload');
    const imagePreview = document.getElementById('image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    
    // Campos de Preços
    const priceInput = document.getElementById('product-price');
    const warrantyInput = document.getElementById('product-warranty');
    const hasOffersInput = document.getElementById('product-has-offers');
    
    // Campos de Oferta
    const offerSelect = document.getElementById('offer-select');
    const paymentTypeSingle = document.getElementById('payment-single');
    const paymentTypeSubscription = document.getElementById('payment-subscription');

    // Campos de Suporte
    const salesPageInput = document.getElementById('product-sales-page');
    const supportEmailInput = document.getElementById('product-support-email');
    const producerNameInput = document.getElementById('product-producer-name');

    // Pega o ID do produto da URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_id');

    let newImageUrl = null;
    let currentUser = null;

    // === FUNÇÃO PARA CARREGAR DADOS DO PRODUTO ===
    async function loadProductData() {
        if (!productId) {
            alert('ID do produto não encontrado!');
            window.location.href = 'produtos.html';
            return;
        }

        try {
            // 1. Garante que o usuário está logado
            const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
            if (sessionError || !session) {
                alert('Você precisa estar logado para editar.');
                window.location.href = 'login.html';
                return;
            }
            currentUser = session.user;

            // 2. Busca os dados do produto
            const { data: product, error } = await _supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .eq('user_id', currentUser.id)
                .single();

            if (error) throw error;
            if (!product) throw new Error('Produto não encontrado ou você não tem permissão.');

            // 3. Preenche o formulário com os dados
            nameInput.value = product.name;
            descriptionInput.value = product.description || '';
            categoryInput.value = product.category || '';
            
            // Preenche Preços
            priceInput.value = formatFromCents(product.price_in_cents);
            warrantyInput.value = product.warranty_days || '7';
            hasOffersInput.checked = product.has_multiple_offers;
            
            // Preenche Oferta
            // (Como na imagem, a "oferta" é o próprio nome do produto)
            offerSelect.innerHTML = `<option value="${product.id}">${product.name}</option>`;
            if (product.payment_type === 'subscription') {
                paymentTypeSubscription.checked = true;
            } else {
                paymentTypeSingle.checked = true;
            }

            // Preenche Suporte
            salesPageInput.value = product.sales_page_url || '';
            supportEmailInput.value = product.support_email || '';
            producerNameInput.value = product.producer_name || '';

            // 4. Preenche a imagem
            if (product.image_url) {
                imagePreview.src = product.image_url;
                imagePreview.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
            }
            
            // 5. Atualiza o link da aba "Links"
            linksTabLink.href = `links.html?product_id=${productId}`;

        } catch (error) {
            console.error('Erro ao carregar produto:', error.message);
            alert('Erro ao carregar produto: ' + error.message);
        }
    }

    // === LÓGICA DE UPLOAD DE IMAGEM ===
    imageUploader.addEventListener('click', () => {
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // ... (Validação de tamanho e tipo) ...
        if (file.size > 10 * 1024 * 1024) { alert('Arquivo muito grande! O máximo é 10MB.'); return; }
        if (!['image/jpeg', 'image/png'].includes(file.type)) { alert('Formato inválido. Apenas JPG ou PNG.'); return; }

        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${currentUser.id}/${fileName}`;

            let { error: uploadError } = await _supabase.storage
                .from('product-images')
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: publicUrlData } = _supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);
            
            if (!publicUrlData) throw new Error('Não foi possível obter o URL público da imagem.');
            
            newImageUrl = publicUrlData.publicUrl;
            console.log('Imagem carregada com sucesso:', newImageUrl);

        } catch (error) {
            console.error('Erro no upload da imagem:', error.message);
            alert('Erro no upload da imagem: ' + error.message);
        }
    });

    // === LÓGICA DE SALVAR PRODUTO ===
    saveButton.addEventListener('click', async () => {
        saveButton.disabled = true;
        saveButton.textContent = 'Salvando...';

        try {
            // 1. Pega os dados do formulário
            const updateData = {
                name: nameInput.value,
                description: descriptionInput.value,
                category: categoryInput.value,
                price_in_cents: parseToCents(priceInput.value), // Converte R$ 5,00 -> 500
                warranty_days: parseInt(warrantyInput.value, 10),
                has_multiple_offers: hasOffersInput.checked,
                payment_type: paymentTypeSingle.checked ? 'single' : 'subscription',
                sales_page_url: salesPageInput.value,
                support_email: supportEmailInput.value,
                producer_name: producerNameInput.value,
            };
            
            // 2. Adiciona a nova imagem (se ela foi alterada)
            if (newImageUrl) {
                updateData.image_url = newImageUrl;
            }

            // 3. Atualiza o banco de dados
            const { error } = await _supabase
                .from('products')
                .update(updateData)
                .eq('id', productId)
                .eq('user_id', currentUser.id); 
            
            if (error) throw error;

            alert('Produto salvo com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar produto:', error.message);
            alert('Erro ao salvar produto: ' + error.message);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Salvar Produto';
        }
    });

    // === LÓGICA DE EXCLUIR PRODUTO ===
    deleteButton.addEventListener('click', async () => {
        if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const { error } = await _supabase
                .from('products')
                .delete()
                .eq('id', productId)
                .eq('user_id', currentUser.id);
            
            if (error) throw error;

            alert('Produto excluído com sucesso.');
            window.location.href = 'produtos.html'; // Volta para a lista

        } catch (error) {
            console.error('Erro ao excluir produto:', error.message);
            alert('Erro ao excluir produto: ' + error.message);
        }
    });

    // === FUNÇÕES HELPER DE PREÇO (MÁSCARA) ===
    function parseToCents(brlString) {
        if (!brlString) return 0;
        return parseInt(brlString.replace(/[R$\.]/g, '').replace(',', ''), 10);
    }

    function formatFromCents(cents) {
        if (typeof cents !== 'number') cents = 0;
        const value = (cents / 100).toFixed(2);
        const [reais, centavos] = value.split('.');
        const reaisFormatado = parseInt(reais, 10).toLocaleString('pt-BR');
        return `${reaisFormatado},${centavos}`;
    }
    
    priceInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); 
        if (value === '') { e.target.value = ''; return; }
        value = value.padStart(3, '0'); 
        const reais = value.slice(0, -2);
        const centavos = value.slice(-2);
        const reaisFormatado = parseInt(reais, 10).toLocaleString('pt-BR');
        e.target.value = `${reaisFormatado},${centavos}`;
    });

    // --- EXECUÇÃO INICIAL ---
    loadProductData();
});