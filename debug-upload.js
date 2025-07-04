// debug-upload.js - Script para testar a edge function de upload
// Execute com: node debug-upload.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://prvfvlyzfyprjliqniki.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydmZ2bHl6ZnlwcmpsaXFuaWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjk5MjUsImV4cCI6MjA2NDY0NTkyNX0.R3TRC1-FOlEuihuIW7oDTNGYYalpzC4v7qn46wOa1dw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log('🧪 Testando upload para exercícios...');
    
    // Criar uma imagem base64 de teste (1x1 pixel PNG transparente)
    const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hR7/3AAAAABJRU5ErkJggg==';
    
    const testData = {
        filename: 'test_exercicio_debug.webp',
        image_base64: testBase64,
        bucket_type: 'exercicios'
    };
    
    console.log('📤 Enviando dados:', {
        filename: testData.filename,
        bucket_type: testData.bucket_type,
        base64Length: testData.image_base64.length
    });
    
    try {
        const response = await supabase.functions.invoke('upload-imagem', {
            body: testData
        });
        
        console.log('📥 Resposta completa:', JSON.stringify(response, null, 2));
        
        if (response.error) {
            console.error('❌ Erro na Edge Function:', response.error);
        } else {
            console.log('✅ Upload bem-sucedido!');
            console.log('🔗 URL gerada:', response.data?.url);
        }
        
    } catch (error) {
        console.error('💥 Erro inesperado:', error);
    }
}

testUpload();
