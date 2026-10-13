package com.bookstore.paymentservice.exception;

public class UnauthorizedException extends RuntimeException{
    public UnauthorizedException(String message) {super(message);}
}
