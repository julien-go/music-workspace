package com.musicworkspace.backend;
import com.musicworkspace.backend.config.PostgresTestContainer;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
@SpringBootTest
@ActiveProfiles("test")
class BackendApplicationTests extends PostgresTestContainer {

	@Test
	void contextLoads() {
	}

}
