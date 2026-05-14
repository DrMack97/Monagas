import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.FileInputStream;
import java.util.HashMap;
import java.util.Map;

public class aggData {

    public static void main(String[] args) throws Exception {
        
        // 1. Apuntar a tu archivo de configuración (el que descargaste)
        FileInputStream serviceAccount = new FileInputStream("serviceAccountKey.json");

        // 2. Configurar las opciones de Firebase
        FirebaseOptions options = FirebaseOptions.builder()
            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
            .build();

        // 3. Inicializar la App
        FirebaseApp.initializeApp(options);

        // 4. Obtener la instancia de Firestore
        Firestore db = FirestoreClient.getFirestore();

        System.out.println("¡Conexión establecida con Firestore!");
        
        // Aquí ya puedes empezar a crear colecciones y documentos

        // Crear un mapa de datos
        Map<String, Object> data = new HashMap<>();
        data.put("nombre", "Prueba de conexión");
        data.put("mensaje", "¡Hola desde VS Code!");
            
        // Guardar en una colección llamada "usuarios" con un documento llamado "test"
        db.collection("usuarios").document("test").set(data);
            
        System.out.println("¡Dato enviado a la base de datos!");
    }

}
