package com.novel.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class PasswordStrengthValidator implements ConstraintValidator<PasswordStrength, String> {

    private int minLength;
    private boolean requireUppercase;
    private boolean requireLowercase;
    private boolean requireDigit;
    private boolean requireSpecialChar;

    @Override
    public void initialize(PasswordStrength constraintAnnotation) {
        this.minLength = constraintAnnotation.minLength();
        this.requireUppercase = constraintAnnotation.requireUppercase();
        this.requireLowercase = constraintAnnotation.requireLowercase();
        this.requireDigit = constraintAnnotation.requireDigit();
        this.requireSpecialChar = constraintAnnotation.requireSpecialChar();
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isEmpty()) {
            return false;
        }

        if (password.length() < minLength) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(String.format("密码长度必须至少%d个字符", minLength))
                   .addConstraintViolation();
            return false;
        }

        if (requireUppercase && !Pattern.compile("[A-Z]").matcher(password).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("密码必须包含至少一个大写字母")
                   .addConstraintViolation();
            return false;
        }

        if (requireLowercase && !Pattern.compile("[a-z]").matcher(password).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("密码必须包含至少一个小写字母")
                   .addConstraintViolation();
            return false;
        }

        if (requireDigit && !Pattern.compile("[0-9]").matcher(password).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("密码必须包含至少一个数字")
                   .addConstraintViolation();
            return false;
        }

        if (requireSpecialChar && !Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]").matcher(password).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("密码必须包含至少一个特殊字符 (!@#$%^&*等)")
                   .addConstraintViolation();
            return false;
        }

        return true;
    }
}
