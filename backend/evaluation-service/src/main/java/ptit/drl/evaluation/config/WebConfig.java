package ptit.drl.evaluation.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * Web configuration to ensure custom ObjectMapper is used for JSON serialization
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Override
    public void configureMessageConverters(List<org.springframework.http.converter.HttpMessageConverter<?>> converters) {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);
        converter.setDefaultCharset(java.nio.charset.StandardCharsets.UTF_8);
        converters.add(0, converter); // Add at the beginning to take precedence
    }
}

