package com.bookstore.userservice.exception;

public class ConflictException extends RuntimeException {
    public ConflictException(String message) { super(message); }
}
