package com.musicworkspace.backend;
import com.musicworkspace.backend.config.PostgresTestContainer;
import com.musicworkspace.backend.config.CloudinaryTestMockConfig;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;
@SpringBootTest
@Import(CloudinaryTestMockConfig.class)
class BackendApplicationTests extends PostgresTestContainer {

	@Test
	void contextLoads() {
	}

}
