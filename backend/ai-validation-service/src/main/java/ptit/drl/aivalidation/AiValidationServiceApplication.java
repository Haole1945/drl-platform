package ptit.drl.aivalidation;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableAsync
public class AiValidationServiceApplication {

	public static void main(String[] args) {
		// Load .env.local file if it exists (for local development)
		try {
			Dotenv dotenv = Dotenv.configure()
					.directory(".")
					.filename(".env.local")
					.ignoreIfMissing()
					.load();
			
			// Set system properties from .env.local
			dotenv.entries().forEach(entry -> {
				String key = entry.getKey();
				String value = entry.getValue();
				if (System.getProperty(key) == null) {
					System.setProperty(key, value);
				}
			});
		} catch (Exception e) {
			// Silently ignore if .env.local doesn't exist
		}
		
		SpringApplication.run(AiValidationServiceApplication.class, args);
	}

}

