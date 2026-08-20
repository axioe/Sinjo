package com.slangs.sinjo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SinjoApplication {

	public static void main(String[] args) {
		SpringApplication.run(SinjoApplication.class, args);
	}

}