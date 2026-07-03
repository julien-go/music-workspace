package com.musicworkspace.backend.config;

import com.cloudinary.Cloudinary;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class CloudinaryTestMockConfig {

    @Bean
    @Primary
    public Cloudinary cloudinary() {
        return Mockito.mock(Cloudinary.class);
    }
}