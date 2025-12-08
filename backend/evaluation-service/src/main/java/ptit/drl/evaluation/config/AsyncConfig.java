package ptit.drl.evaluation.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async Configuration for async validation processing
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    
    @Bean(name = "validationExecutor")
    public Executor validationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("validation-");
        executor.initialize();
        return executor;
    }
}

