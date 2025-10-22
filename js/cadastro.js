document.addEventListener('DOMContentLoaded', () => {

    // ======================================================
    // Configuração do Supabase (Suas chaves já estão aqui)
    // ======================================================
    const SUPABASE_URL = 'https://qxkmlwpbkvuqnmlczutf.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4a21sd3Bia3Z1cW5tbGN6dXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDM2OTgsImV4cCI6MjA3NjcxOTY5OH0.d7NU19UdzheUxrNhkhsjtqpa8Yhl3Oo8jSjNX5t2xzY';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    // ======================================================

    // 1. Seleciona os elementos
    const signupForm = document.getElementById('signupForm');
    const inputLabel = document.getElementById('inputLabel');
    const inputWrapper = document.getElementById('inputWrapper');
    const termsContainer = document.getElementById('termsContainer');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const nextButton = document.getElementById('nextButton');
    const buttonText = document.getElementById('buttonText');
    const steps = document.querySelectorAll('.step');

    // Objeto para armazenar todos os dados
    let formData = {
        nome: '',
        email: '',
        senha: '', // <-- ADICIONADO
        documento: '',
        celular: '',
        faturamento: '',
        conheceu_como: ''
    };

    // 2. Define os dados de cada etapa (AGORA COM 7 ETAPAS)
    const stepData = [
        // Etapa 0
        {
            key: 'nome',
            type: 'input',
            inputType: 'text',
            label: 'Seu nome',
            placeholder: 'Qual seu nome?'
        },
        // Etapa 1
        {
            key: 'email',
            type: 'input',
            inputType: 'email',
            label: 'Seu email',
            placeholder: 'Qual seu email?'
        },
        // Etapa 2 (NOVA ETAPA)
        {
            key: 'senha',
            type: 'input',
            inputType: 'password', // <-- Tipo senha
            label: 'Crie uma senha',
            placeholder: 'Mínimo 6 caracteres'
        },
        // Etapa 3 (era 2)
        {
            key: 'documento',
            type: 'input',
            inputType: 'text', 
            label: 'Pessoa Física/Jurídica',
            placeholder: 'CPF/CNPJ'
        },
        // Etapa 4 (era 3)
        {
            key: 'celular',
            type: 'input',
            inputType: 'tel',
            label: 'Seu celular',
            placeholder: 'Celular (com DDD)'
        },
        // Etapa 5 (era 4)
        {
            key: 'faturamento',
            type: 'select',
            label: 'Faturamento mensal',
            placeholder: 'Qual seu faturamento mensal?',
            options: [ 'R$ 0,00 a R$ 1.000,00', 'R$ 1.000,00 a R$ 5.000,00', 'R$ 5.000,00 a R$ 10.000,00', 'R$ 10.000,00 a R$ 30.000,00', 'Acima de R$ 30.000,00']
        },
        // Etapa 6 (era 5)
        {
            key: 'conheceu_como',
            type: 'select',
            label: 'Pergunta',
            placeholder: 'Como conheceu a Platta?',
            options: ['Instagram', 'Youtube', 'Facebook', 'Google', 'Indicação de amigo']
        }
    ];

    // 3. Define a etapa inicial
    let currentStep = 0;

    // Função Helper (MÁSCARA DE CELULAR)
    function formatPhoneNumber(value) {
        let digits = value.replace(/\D/g, '').substring(0, 11);
        if (digits.length > 7) {
            return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        } else if (digits.length > 2) {
            return digits.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        } else if (digits.length > 0) {
            return digits.replace(/^(\d{0,2})/, '($1');
        }
        return '';
    }

    // 4. Adiciona o "ouvinte" de clique no botão (MUDANÇA: 'async' adicionado)
    nextButton.addEventListener('click', async (event) => {
        event.preventDefault(); 

        const currentElement = inputWrapper.firstElementChild;
        const currentValue = currentElement.value;

        // 5. Validação
        if (currentValue.trim() === '') {
            alert('Por favor, preencha o campo.');
            return;
        }

        // Validação de Email (Etapa 1)
        if (currentStep === 1 && !currentValue.includes('@')) { // Verificação simples de @
            alert('Por favor, insira um email válido.');
            return;
        }
        
        // Validação de Senha (Etapa 2)
        if (currentStep === 2 && currentValue.length < 6) {
            alert('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        
        // Validação dos Termos (Etapa 0)
        if (currentStep === 0 && !termsCheckbox.checked) {
            alert('Você precisa aceitar os termos de uso para continuar.');
            return;
        }

        // --- Se a validação passar ---

        // Salva o dado no objeto
        const currentKey = stepData[currentStep].key;
        formData[currentKey] = currentValue;
        console.log('Dados do formulário:', formData);
        
        // Avança para a próxima etapa
        currentStep++;

        // 6. Verifica se o formulário acabou (AGORA VERIFICA SE 7 >= 7)
        if (currentStep >= stepData.length) {
            
            // Atingiu o final
            steps[steps.length - 1].classList.add('active'); // Ativa o último círculo
            
            // ======================================================
            // INÍCIO: LÓGICA DE CADASTRO REAL COM AUTH
            // ======================================================
            
            buttonText.textContent = 'Salvando...';
            nextButton.disabled = true;

            try {
                // 1. Tenta criar o usuário no 'auth.users'
                const { data: authData, error: authError } = await _supabase.auth.signUp({
                    email: formData.email,
                    password: formData.senha,
                });

                if (authError) throw authError; // Joga o erro para o catch
                if (!authData.user) throw new Error('Usuário não foi criado.');

                console.log('Usuário de Auth criado:', authData.user.id);

                // 2. Se o usuário foi criado, insere os dados do perfil em 'cadastros'
                const profileData = {
                    user_id: authData.user.id, // Vincula ao ID do usuário
                    nome: formData.nome,
                    documento: formData.documento,
                    celular: formData.celular,
                    faturamento: formData.faturamento,
                    conheceu_como: formData.conheceu_como
                };

                const { error: profileError } = await _supabase
                    .from('cadastros') // Nome da sua tabela
                    .insert(profileData);

                if (profileError) throw profileError; // Joga o erro para o catch

                // SUCESSO!
                console.log('Perfil salvo com sucesso!');
                
                // Redireciona para o dashboard
                // (O Supabase pode enviar um email de confirmação. Se enviar, o login
                // só funcionará *depois* da confirmação. Você pode desabilitar
                // a confirmação de email no seu painel do Supabase)
                alert('Cadastro concluído! Redirecionando para o login...');
                window.location.href = 'login.html'; // Redireciona para o LOGIN

            } catch (error) {
                // ERRO!
                console.error('Erro no cadastro:', error.message);
                if (error.message.includes("User already registered")) {
                    alert('Este email já está cadastrado. Tente fazer login.');
                } else {
                    alert(`Houve um erro no cadastro: ${error.message}`);
                }
                
                // Reverte o botão para o usuário tentar de novo
                buttonText.textContent = 'Finalizar Cadastro';
                nextButton.disabled = false;
                
                // Reverte a etapa para o usuário não ficar preso
                currentStep--;
            }
            // ======================================================
            // FIM: LÓGICA DE CADASTRO
            // ======================================================

            return; // Impede a chamada do updateFormUI()
        }

        // 7. Atualiza a UI para a próxima etapa
        updateFormUI(currentStep);
    });

    // 8. Função que atualiza o HTML
    function updateFormUI(step) {
        const data = stepData[step];

        // Atualiza o Label
        inputLabel.textContent = data.label;

        // Limpa o 'wrapper' do input anterior
        inputWrapper.innerHTML = '';

        // Cria e insere o novo elemento (input ou select)
        if (data.type === 'input') {
            const newIn = document.createElement('input');
            newIn.type = data.inputType;
            newIn.id = 'mainInput';
            newIn.placeholder = data.placeholder;
            inputWrapper.appendChild(newIn);

            // Adiciona validação e máscara
            switch(step) {
                case 3: // Etapa 3: CPF/CNPJ (mudou de 2 para 3)
                    newIn.maxLength = 14; 
                    newIn.addEventListener('input', (e) => {
                        e.target.value = e.target.value.replace(/\D/g, '');
                    });
                    break;
                case 4: // Etapa 4: Celular (mudou de 3 para 4)
                    newIn.maxLength = 15;
                    newIn.addEventListener('input', (e) => {
                        e.target.value = formatPhoneNumber(e.target.value);
                    });
                    break;
            }

        } else if (data.type === 'select') {
            const newSel = document.createElement('select');
            newSel.id = 'mainInput';
            newSel.required = true; 
            
            const placeholderOpt = new Option(data.placeholder, "", true, true);
            placeholderOpt.disabled = true;
            newSel.appendChild(placeholderOpt);

            data.options.forEach(optText => {
                newSel.appendChild(new Option(optText, optText));
            });
            
            inputWrapper.appendChild(newSel);
        }

        // Atualiza os círculos indicadores
        if (step > 0) {
            steps[step - 1].classList.remove('active');
            steps[step].classList.add('active');
        }

        // Esconde o checkbox de termos após a primeira etapa
        if (step === 1) {
            termsContainer.style.display = 'none';
            // Também esconde o footer de login
            document.getElementById('cadastro-footer').style.display = 'none';
        }

        // Muda o texto do botão no último passo
        if (step === stepData.length - 1) {
            buttonText.textContent = 'Finalizar Cadastro';
        }
    }
});