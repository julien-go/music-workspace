package com.musicworkspace.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicworkspace.backend.dto.AddMemberRequest;
import com.musicworkspace.backend.dto.ProjectMemberResponse;
import com.musicworkspace.backend.dto.UpdateMemberRoleRequest;
import com.musicworkspace.backend.dto.UserSummary;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.exception.MemberNotFoundException;
import com.musicworkspace.backend.exception.OwnerRoleException;
import com.musicworkspace.backend.security.JwtService;
import com.musicworkspace.backend.service.ProjectMemberService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProjectMemberController.class)
@WithMockUser(username = "test@example.com")
class ProjectMemberControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProjectMemberService projectMemberService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private UUID projectId;
    private UUID memberId;
    private ProjectMemberResponse response;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        memberId = UUID.randomUUID();
        response = new ProjectMemberResponse(memberId,
                new UserSummary(UUID.randomUUID(), "collab"),
                ProjectRole.COLLABORATOR, Instant.now());
    }

    @Test
    void addMember_returns201() throws Exception {
        AddMemberRequest request = new AddMemberRequest(UUID.randomUUID(), ProjectRole.COLLABORATOR);
        when(projectMemberService.addMember(eq(projectId), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/projects/{projectId}/members", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("COLLABORATOR"));
    }

    @Test
    void addMember_returns403WhenOwnerRole() throws Exception {
        AddMemberRequest request = new AddMemberRequest(UUID.randomUUID(), ProjectRole.OWNER);
        when(projectMemberService.addMember(eq(projectId), any(), any()))
                .thenThrow(new OwnerRoleException("Cannot assign OWNER role"));

        mockMvc.perform(post("/api/v1/projects/{projectId}/members", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void list_returns200() throws Exception {
        when(projectMemberService.findAll(eq(projectId), any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/projects/{projectId}/members", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].role").value("COLLABORATOR"));
    }

    @Test
    void updateRole_returns200() throws Exception {
        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.VIEWER);
        when(projectMemberService.updateRole(eq(projectId), eq(memberId), any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/projects/{projectId}/members/{memberId}", projectId, memberId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void updateRole_returns404WhenMemberNotFound() throws Exception {
        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.VIEWER);
        when(projectMemberService.updateRole(eq(projectId), eq(memberId), any(), any()))
                .thenThrow(new MemberNotFoundException("Member not found"));

        mockMvc.perform(patch("/api/v1/projects/{projectId}/members/{memberId}", projectId, memberId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void removeMember_returns204() throws Exception {
        doNothing().when(projectMemberService).removeMember(eq(projectId), eq(memberId), any());

        mockMvc.perform(delete("/api/v1/projects/{projectId}/members/{memberId}", projectId, memberId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }
}
