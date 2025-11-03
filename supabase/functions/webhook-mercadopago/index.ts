// Caminho do arquivo: supabase/functions/webhook-mercadopago/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

console.log("Função 'webhook-mercadopago' (Versão Segura) iniciada...");

// Pega as chaves secretas do ambiente
const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('MP_SERVICE_ROLE_KEY')!

// Inicia o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // 1. Verificar se é um método POST
  if (req.method !== 'POST') {
    console.warn(`Método não permitido: ${req.method}`);
    return new Response('Método não permitido', { status: 405 });
  }

  // Verificar se as chaves secretas foram carregadas
  if (!mpAccessToken) {
    console.error('ERRO CRÍTICO: MP_ACCESS_TOKEN não foi definido nos segredos.');
    return new Response('Configuração interna do servidor incompleta', { status: 500 });
  }

  try {
    // 2. Receber a notificação
    const notification = await req.json();
    console.log('Notificação recebida:', JSON.stringify(notification, null, 2));

    // 3. Verificar se é uma notificação de pagamento relevante
    if (notification.action === 'payment.updated' && notification.data.id) {
      
      const paymentId = notification.data.id;

      // 4. ✅ ETAPA DE SEGURANÇA: Validar com a API do Mercado Pago
      console.log(`Validando ID ${paymentId} diretamente com a API do Mercado Pago...`);

      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`
          }
        }
      );

      // Se o Mercado Pago não encontrar o pagamento (ex: 404), tratamos como erro.
      if (!mpResponse.ok) {
        const errorBody = await mpResponse.text();
        console.warn(`Falha ao buscar ID ${paymentId} no MP. Status: ${mpResponse.status}. Body: ${errorBody}`);
        // Retornamos 200 mesmo assim, para o MP parar de tentar.
        return new Response('Notificação recebida, mas ID não validado no MP.', { status: 200 });
      }

      // 5. Temos a resposta real. Vamos extrair o status.
      const paymentDetails = await mpResponse.json();
      const statusRealDoMP = paymentDetails.status; // ex: "approved", "rejected", "in_process"
      
      console.log(`Status real do MP para ${paymentId}: ${statusRealDoMP}`);

      // 6. Atualizar nosso banco de dados APENAS SE o status for "approved"
      if (statusRealDoMP === 'approved') {
        
        console.log(`Pagamento ${paymentId} APROVADO. Atualizando banco de dados...`);

        // Usamos o status 'paid' no NOSSO banco (como definido no seu ENUM)
        const { data, error } = await supabase
          .from('orders') 
          .update({ status: 'paid' }) // <- O status do nosso banco
          .eq('mp_payment_id', paymentId); // <- A coluna que procuramos

        if (error) {
          console.error('Erro ao atualizar Supabase:', error);
          // (Ainda respondemos 200 para o MP)
        } else {
          console.log('Banco de dados atualizado com sucesso:', data);
        }
      } else {
        // Se o status for 'rejected', 'in_process', etc., nós apenas registramos
        // e não atualizamos o banco (ou poderíamos atualizar para 'failed')
        console.log(`Status ${statusRealDoMP} não requer atualização para 'paid'. Ignorando.`);
        
        // (Opcional: Você pode adicionar uma lógica para
        // atualizar para 'failed' se o statusRealDoMP for 'rejected')
      }
    }

    // 7. Responder ao Mercado Pago com status 200 (OK)
    return new Response('Notificação recebida com sucesso', { status: 200 });

  } catch (err) {
    console.error('Erro geral ao processar o webhook:', err.message);
    return new Response(`Erro no Webhook: ${err.message}`, { status: 400 });
  }
})