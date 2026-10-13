package com.bookstore.apigateway.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.header.XFrameOptionsServerHttpHeadersWriter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http, JwtAuthenticationConverter jwtAuthenticationConverter) throws Exception {
        http
                .csrf(ServerHttpSecurity.CsrfSpec   ::disable)
                .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.  mode(XFrameOptionsServerHttpHeadersWriter.Mode.SAMEORIGIN)))
                .authorizeExchange(exchangeSpec -> exchangeSpec
                        .pathMatchers( HttpMethod.POST, "/api/users/register").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/books/**", "/api/books").permitAll()
                        .pathMatchers( "/api/stores/me/branch/public/**").permitAll()
                        .pathMatchers( "/api/stores/public/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/eureka/**").permitAll()
                        .pathMatchers("/actuator/health", "/api/payments/webhook").permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(resourceServer ->
                        resourceServer.jwt(org.springframework.security.config.Customizer.withDefaults())
                );

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();

        jwtConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = new ArrayList<>();

            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
                roles.forEach(role -> authorities.add(new SimpleGrantedAuthority(role.toString())));
            }

            return authorities;
        });

        return jwtConverter;
    }

}
