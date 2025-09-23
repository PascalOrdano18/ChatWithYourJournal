// Script de diagnóstico para verificar la configuración de Supabase
// Ejecuta esto en la consola del navegador en tu aplicación

async function debugSupabaseSetup() {
  console.log('🔍 Diagnosticando configuración de Supabase...');
  
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Usuario autenticado:', user ? 'Sí' : 'No');
    if (authError) console.error('❌ Error de autenticación:', authError);
    
    // Verificar buckets disponibles
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('🪣 Buckets disponibles:', buckets);
    if (bucketsError) console.error('❌ Error al listar buckets:', bucketsError);
    
    // Verificar si el bucket journal-media existe
    const journalMediaBucket = buckets?.find(b => b.id === 'journal-media');
    console.log('📁 Bucket journal-media existe:', journalMediaBucket ? 'Sí' : 'No');
    
    if (journalMediaBucket) {
      console.log('📋 Configuración del bucket:', {
        id: journalMediaBucket.id,
        name: journalMediaBucket.name,
        public: journalMediaBucket.public,
        created_at: journalMediaBucket.created_at
      });
    }
    
    // Intentar subir un archivo de prueba
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const testFileName = `${user?.id}/test-${Date.now()}.txt`;
    
    console.log('🧪 Intentando subir archivo de prueba...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('journal-media')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.error('❌ Error al subir archivo de prueba:', uploadError);
    } else {
      console.log('✅ Archivo de prueba subido exitosamente:', uploadData);
      
      // Limpiar archivo de prueba
      await supabase.storage.from('journal-media').remove([testFileName]);
      console.log('🧹 Archivo de prueba eliminado');
    }
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar diagnóstico
debugSupabaseSetup();


