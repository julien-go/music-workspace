package com.musicworkspace.backend;
import com.musicworkspace.backend.config.PostgresTestContainer;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
@SpringBootTest
class BackendApplicationTests extends PostgresTestContainer {

	@Test
	void contextLoads() {
	}

}
