package ptit.drl.evaluation.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;

import java.io.IOException;

/**
 * Jackson configuration for LocalDate/LocalDateTime serialization
 * and Page serialization
 */
@Configuration
public class JacksonConfig {
    
    @Bean
    @Primary
    @SuppressWarnings({"rawtypes", "unchecked"})
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        
        // Custom serializer for Page to avoid Unpaged serialization issues
        SimpleModule pageModule = new SimpleModule();
        // Use raw type to avoid generic type issues
        pageModule.addSerializer((Class) Page.class, new PageSerializer());
        mapper.registerModule(pageModule);
        
        return mapper;
    }
    
    /**
     * Custom serializer for Page that excludes pageable and sort to avoid Unpaged issues
     */
    public static class PageSerializer extends JsonSerializer<Page<?>> {
        @Override
        public void serialize(Page<?> page, JsonGenerator gen, SerializerProvider serializers) throws IOException {
            gen.writeStartObject();
            gen.writeObjectField("content", page.getContent());
            gen.writeNumberField("totalElements", page.getTotalElements());
            gen.writeNumberField("totalPages", page.getTotalPages());
            gen.writeNumberField("number", page.getNumber());
            gen.writeNumberField("size", page.getSize());
            gen.writeBooleanField("first", page.isFirst());
            gen.writeBooleanField("last", page.isLast());
            gen.writeNumberField("numberOfElements", page.getNumberOfElements());
            gen.writeEndObject();
        }
    }
}

