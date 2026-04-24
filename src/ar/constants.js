// ═══════════════════════════════════════════════════════════
// LANDMARK INDICES
// ═══════════════════════════════════════════════════════════

export const POSE_IDX = {
    NOSE: 0, L_EYE: 2, R_EYE: 5,
    L_EAR: 7, R_EAR: 8,                          // ← added (needed for head tracking)
    L_SHOULDER: 11, R_SHOULDER: 12,
    L_ELBOW: 13, R_ELBOW: 14,
    L_WRIST: 15, R_WRIST: 16,
    L_HIP: 23, R_HIP: 24,
    L_KNEE: 25, R_KNEE: 26,                    // ← added (needed for leg chains)
    L_ANKLE: 27, R_ANKLE: 28,                   // ← added (needed for leg chains)
}

export const HAND_IDX = {
    WRIST: 0, THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
    INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
    MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
    RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
    PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
}

export const FACE_IDX = {
    NOSE_TIP: 1, FOREHEAD: 10, CHIN: 152,
    L_EYE_L: 33, L_EYE_R: 133, L_EYE_TOP: 159, L_EYE_BOT: 145,
    R_EYE_L: 362, R_EYE_R: 263, R_EYE_TOP: 386, R_EYE_BOT: 374,
    L_TEMPLE: 234, R_TEMPLE: 454,
    L_BROW_OUT: 70, R_BROW_OUT: 300,
    L_BROW_TOP: 105, R_BROW_TOP: 334,
    GLABELLA: 168, L_CHEEK: 116, R_CHEEK: 345,
}

export const FINGER_CHAINS = [
    [0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [0, 9, 10, 11, 12], [0, 13, 14, 15, 16], [0, 17, 18, 19, 20],
]

export const FINGER_TIPS = new Set([4, 8, 12, 16, 20])
export const KNUCKLES = new Set([5, 9, 13, 17])