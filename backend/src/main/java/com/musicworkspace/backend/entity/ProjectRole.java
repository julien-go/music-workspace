package com.musicworkspace.backend.entity;

public enum ProjectRole {
    VIEWER(1),
    COLLABORATOR(2),
    OWNER(3);

    private final int level;

    ProjectRole(int level) {
        this.level = level;
    }

    public boolean isAtLeast(ProjectRole required) {
        return this.level >= required.level;
    }
}
