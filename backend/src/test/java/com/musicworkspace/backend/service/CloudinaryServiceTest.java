package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.musicworkspace.backend.exception.CloudinaryUploadException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @InjectMocks
    private CloudinaryService cloudinaryService;

    private final MockMultipartFile file = new MockMultipartFile(
            "file", "demo.mp3", "audio/mpeg", new byte[] {(byte) 0xFF, (byte) 0xFB, 0x00, 0x01});

    @BeforeEach
    void setUp() {
        when(cloudinary.uploader()).thenReturn(uploader);
    }

    @Test
    void upload_streamsTheFileInsteadOfBufferingIt() throws IOException {
        when(uploader.uploadLarge(any(), any(Map.class)))
                .thenReturn(Map.of("secure_url", "https://cloudinary.test/audio.mp3"));

        String url = cloudinaryService.upload(file, "folder", "v1-abc", "video", false);

        assertThat(url).isEqualTo("https://cloudinary.test/audio.mp3");

        ArgumentCaptor<Object> fileArg = ArgumentCaptor.forClass(Object.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> options = ArgumentCaptor.forClass(Map.class);
        verify(uploader).uploadLarge(fileArg.capture(), options.capture());

        // An InputStream keeps heap usage bounded by the SDK chunk size —
        // passing a byte[] here would reintroduce the full-file buffering.
        assertThat(fileArg.getValue()).isInstanceOf(InputStream.class);
        assertThat(options.getValue())
                .containsEntry("folder", "folder")
                .containsEntry("public_id", "v1-abc")
                .containsEntry("resource_type", "video")
                .containsEntry("overwrite", false);
    }

    @Test
    void upload_wrapsIOExceptionsInCloudinaryUploadException() throws IOException {
        when(uploader.uploadLarge(any(), any(Map.class))).thenThrow(new IOException("network"));

        assertThatThrownBy(() ->
                cloudinaryService.upload(file, "folder", "cover", "image", true))
                .isInstanceOf(CloudinaryUploadException.class);
    }
}
