package ptit.drl.evaluation;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableScheduling
public class EvaluationServiceApplication {

	public static void main(String[] args) {
		// Load .env.local file if it exists (for local development)
		// This will load environment variables from .env.local into System properties
		try {
			Dotenv dotenv = Dotenv.configure()
					.directory(".") // Look in current directory (project root)
					.filename(".env.local") // Use .env.local file
					.ignoreIfMissing() // Don't fail if file doesn't exist
					.load();
			
			// Set system properties from .env.local so Spring Boot can read them
			dotenv.entries().forEach(entry -> {
				String key = entry.getKey();
				String value = entry.getValue();
				if (System.getProperty(key) == null) {
					System.setProperty(key, value);
				}
			});
		} catch (Exception e) {
			// Silently ignore if .env.local doesn't exist (e.g., in production)
			System.out.println("Note: .env.local file not found or could not be loaded. Using system environment variables.");
		}
		
		SpringApplication.run(EvaluationServiceApplication.class, args);
	}

}

