// Caminho: js/checkout.js

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Inicializa o Supabase (com as chaves PÚBLICAS)
    const SUPABASE_URL = 'https://qxkmlwpbkvuqnmlczutf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4a21sd3Bia3Z1cW5tbGN6dXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDM2OTgsImV4cCI6MjA3NjcxOTY5OH0.d7NU19UdzheUxrNhkhsjtqpa8Yhl3Oo8jSjNX5t2xzY';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // 2. Seleciona os elementos
    const checkoutForm = document.getElementById('checkoutForm');
    const continueButton = checkoutForm.querySelector('.btn-continue');
    
    // Elementos do Resumo
    const productNameEl = document.getElementById('product-name');
    const productImageEl = document.getElementById('product-image');
    const subtotalDisplayEl = document.getElementById('subtotal-display');
    const totalDisplayEl = document.getElementById('total-display');

    // NOVO: Seleciona os campos do formulário para as máscaras
    const emailInput = document.getElementById('email');
    const celularInput = document.getElementById('celular');
    const cpfInput = document.getElementById('cpf');

    // 3. Pegar o ID do Produto pela URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_id');

    // ===================================================================
    // FUNÇÕES HELPER (Formatação e Máscaras)
    // ===================================================================

    // Formata centavos para BRL (ex: 1000 -> "R$ 10,00")
    function formatAsBRL(cents) {
        const reais = (cents / 100).toFixed(2);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(reais);
    }

    // NOVO: Função de máscara para Celular (XX) XXXXX-XXXX
    function formatCelular(value) {
        let v = value.replace(/\D/g, ''); // Remove tudo que não é dígito
        v = v.substring(0, 11); // Limita a 11 dígitos
        if (v.length > 6) {
            v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        } else if (v.length > 2) {
            v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        } else {
            v = v.replace(/^(\d*)/, '($1');
        }
        return v;
    }

    // NOVO: Função de máscara para CPF (XXX.XXX.XXX-XX)
    function formatCPF(value) {
        let v = value.replace(/\D/g, ''); // Remove tudo que não é dígito
        v = v.substring(0, 11); // Limita a 11 dígitos
        if (v.length > 6) {
            v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
        } else if (v.length > 3) {
            v = v.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
        } else {
            v = v.replace(/^(\d*)/, '$1');
        }
        return v;
    }

    // ===================================================================
    // BLOCO DE CARREGAMENTO DE PRODUTO
    // ===================================================================
    
    async function loadProductDetails(id) {
        if (!id) {
            alert('Erro: ID do produto não encontrado. Por favor, volte e selecione um produto.');
            continueButton.disabled = true;
            productNameEl.textContent = 'Produto inválido';
            return;
        }

        try {
            const { data: product, error } = await _supabase
                .from('products')
                .select('name, price_in_cents, image_url')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!product) throw new Error('Produto não encontrado.');

            productNameEl.textContent = product.name;
            productImageEl.src = product.image_url || 'img/Logo.png';
            const priceBRL = formatAsBRL(product.price_in_cents); 
            subtotalDisplayEl.textContent = priceBRL;
            totalDisplayEl.textContent = priceBRL; 

        } catch (error) {
            console.error('Erro ao carregar produto:', error.message);
            productNameEl.textContent = 'Erro ao carregar produto';
            alert('Não foi possível carregar os detalhes do produto.');
            continueButton.disabled = true;
        }
    }

    // Chama a função para carregar os dados
    await loadProductDetails(productId);

    // ===================================================================
    // NOVO: OUVINTES DE EVENTO (EVENT LISTENERS) PARA MÁSCARAS
    // ===================================================================
    
    celularInput.addEventListener('input', (e) => {
        e.target.value = formatCelular(e.target.value);
    });

    cpfInput.addEventListener('input', (e) => {
        e.target.value = formatCPF(e.target.value);
    });

    // ===================================================================
    // LÓGICA DE SUBMISSÃO DO FORMULÁRIO (Atualizada)
    // ===================================================================

    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const customerData = {
            nome: document.getElementById('nome').value,
            email: emailInput.value,
            celular: celularInput.value,
            cpf: cpfInput.value
        };

        // ===================================================================
        // INÍCIO: NOVA LÓGICA DE VALIDAÇÃO
        // ===================================================================
        if (!customerData.nome) {
            alert('Por favor, preencha seu Nome Completo.');
            return;
        }
        
        // 1. Validação de Email (termina com @gmail.com)
        if (!customerData.email.endsWith('@gmail.com')) {
            alert('Por favor, use um e-mail válido do Google (@gmail.com).');
            return;
        }
        
        // 2. Validação de Celular (deve ter 11 dígitos)
        const celularNumeros = customerData.celular.replace(/\D/g, '');
        if (celularNumeros.length !== 11) {
            alert('Por favor, preencha um número de celular válido com 11 dígitos (DDD + 9).');
            return;
        }
        
        // 3. Validação de CPF (deve ter 11 dígitos)
        const cpfNumeros = customerData.cpf.replace(/\D/g, '');
        if (cpfNumeros.length !== 11) {
            alert('Por favor, preencha um CPF válido com 11 dígitos.');
            return;
        }
        // ===================================================================
        // FIM: NOVA LÓGICA DE VALIDAÇÃO
        // ===================================================================

        continueButton.textContent = 'Processando...';
        continueButton.disabled = true;

        try {
            // 6. Pega a sessão do usuário logado
            const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

            if (sessionError || !session) {
                alert('Você precisa estar logado para comprar.');
                window.location.href = 'login.html';
                return;
            }

            // 7. Invoca a Edge Function 'create-payment'
            const { data, error } = await _supabase.functions.invoke('create-payment', {
                body: {
                    productId: productId,
                    customerData: customerData
                },
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (error) throw error;

            // 8. SUCESSO! Redireciona para o checkout do Mercado Pago
            const paymentUrl = data.paymentUrl;
            window.location.href = paymentUrl;

        } catch (error) {
            console.error('Erro ao criar pagamento:', error.message);
            alert(`Erro ao processar seu pagamento: ${error.message}`);
            continueButton.textContent = 'Finalizar Pagamento';
            continueButton.disabled = false;
        }
    });
});