import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Initialize the agent at application startup.
const fpPromise = FingerprintJS.load();

export interface DeviceInfo {
    visitorId: string;
    components: any;
}

export const getDeviceFingerprint = async (): Promise<DeviceInfo> => {
    try {
        const fp = await fpPromise;
        const result = await fp.get();
        return {
            visitorId: result.visitorId,
            components: result.components
        };
    } catch (error) {
        console.error('Failed to get device fingerprint:', error);
        // Fallback or re-throw depending on strictness requirements
        throw error;
    }
};

export const getDeviceMetadata = async () => {
    const { components } = await getDeviceFingerprint();

    // Extract useful metadata safely
    const metadata = {
        browser: components.vendor?.value || 'Unknown',
        os: components.platform?.value || 'Unknown',
        screenResolution: components.screenResolution?.value ? `${components.screenResolution.value[0]}x${components.screenResolution.value[1]}` : 'Unknown',
        timezone: components.timezone?.value || 'Unknown',
        languages: components.languages?.value || [],
    };

    return metadata;
};
