package com.bookstore.bookservice.exception;

public class UnauthorizedException extends RuntimeException{
    public UnauthorizedException(String message) {super(message);}
}
