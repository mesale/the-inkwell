package com.bookstore.paymentservice.exception;

public class ConflictException extends RuntimeException {
    public ConflictException(String message) { super(message); }
}
