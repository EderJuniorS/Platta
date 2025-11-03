// Caminho: supabase/functions/create-payment/index.ts
// VERSÃO SIMPLES (REDIRECIONAMENTO)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Pega as chaves secretas do ambiente
const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('MP_SERVICE_ROLE_KEY')!

// Inicia o cliente Admin do Supabase
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // 1. Lidar com a requisição CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Receber os dados do front-end
    const { productId, customerData } = await req.json()
    
    // 3. Validar o usuário que está fazendo a chamada
    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.split('Bearer ')[1]
    const { data: { user }, error: userError } = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
      .auth.getUser(jwt)
      
    if (userError || !user) throw new Error('Usuário não autenticado')
    
    // 4. Buscar o preço do produto NO BANCO DE DADOS
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('name, price_in_cents')
      .eq('id', productId)
      .single()

    if (productError) throw new Error(`Produto não encontrado: ${productError.message}`)
    
    const priceInCents = product.price_in_cents
    const priceInReais = (priceInCents / 100) // Formato 0.20

    // 5. Criar o pedido (Order) no seu banco com status "pending"
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        product_id: productId,
        amount_cents: priceInCents,
        status: 'pending',
        gateway: 'mercadopago',
      })
      .select('id')
      .single()
      
    if (orderError) throw new Error(`Erro ao criar pedido: ${orderError.message}`)
    
    const orderId = newOrder.id // O ID do SEU pedido no Supabase

    // 6. Criar a PREFERÊNCIA DE PAGAMENTO no Mercado Pago
    const preferencePayload = {
      items: [
        {
          title: product.name,
          quantity: 1,
          unit_price: priceInReais
        }
      ],
      payer: {
        email: customerData.email,
        name: customerData.nome
      },
      external_reference: orderId, // Vincula o pagamento do MP ao seu pedido
      notification_url: `https://qxkmlwpbkvuqnmlczutf.supabase.co/functions/v1/webhook-mercadopago`,
      // URL para onde o cliente vai após pagar (sua página de obrigado)
      back_urls: {
        success: `http://127.0.0.1:5500/obrigado.html`, // <-- CRIE ESTA PÁGINA
        failure: `http://127.0.0.1:5500/checkout.html?product_id=${productId}`,
        pending: `http://127.0.0.1:5500/checkout.html?product_id=${productId}`
      },
      auto_return: "approved" // Redireciona automaticamente
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferencePayload)
    })

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.json();
      console.error('Erro do Mercado Pago:', errorBody);
      throw new Error('Falha ao criar preferência de pagamento');
    }

    const preferenceResult = await mpResponse.json()
    
    // 7. Salvar o ID da Preferência no seu banco de dados
    await supabaseAdmin
      .from('orders')
      .update({ mp_preference_id: preferenceResult.id })
      .eq('id', orderId)

    // 8. Retornar o link de pagamento (init_point) para o front-end
    const paymentUrl = preferenceResult.init_point // O link de checkout

    return new Response(JSON.stringify({ paymentUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // CORREÇÃO: Verificamos o tipo do erro antes de usá-lo
    const errorMessage = (error instanceof Error) 
      ? error.message 
      : 'Erro desconhecido na Edge Function';

    console.error('Erro na função create-payment:', errorMessage)
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})