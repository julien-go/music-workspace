package com.musicworkspace.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.musicworkspace.backend.exception.CloudinaryUploadException;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String upload(MultipartFile file, String folder, String publicId,
                         String resourceType, boolean overwrite) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "public_id", publicId,
                            "resource_type", resourceType,
                            "overwrite", overwrite
                    )
            );
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new CloudinaryUploadException("Failed to upload file", e);
        }
    }

    public void delete(String publicId, String resourceType) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
        } catch (IOException ignored) {
            // best-effort cleanup — failure here does not affect the caller's error path
        }
    }

    /**
     * Best-effort removal of every asset under a folder (project deletion).
     * A failure leaves orphaned assets in Cloudinary but must never fail the
     * deletion itself — the DB rows are gone either way.
     */
    public void deleteFolder(String folder) {
        try {
            cloudinary.api().deleteResourcesByPrefix(folder + "/", ObjectUtils.asMap("resource_type", "image"));
            cloudinary.api().deleteResourcesByPrefix(folder + "/", ObjectUtils.asMap("resource_type", "video"));
            cloudinary.api().deleteFolder(folder, ObjectUtils.emptyMap());
        } catch (Exception ignored) {
            // best-effort cleanup
        }
    }
}
