export class WhiteboardVersionManager {
  static async saveVersion(base44, callId, canvasState, createdBy, description = '') {
    try {
      const existingVersions = await base44.entities.WhiteboardVersion.filter({
        call_id: callId,
      });

      const versionNumber = existingVersions.length + 1;

      return await base44.entities.WhiteboardVersion.create({
        call_id: callId,
        canvas_state: canvasState,
        version_number: versionNumber,
        created_by: createdBy,
        timestamp: new Date().toISOString(),
        description,
      });
    } catch (err) {
      console.error('Failed to save whiteboard version:', err);
      throw err;
    }
  }

  static async getVersions(base44, callId) {
    try {
      const versions = await base44.entities.WhiteboardVersion.filter(
        { call_id: callId },
        'version_number',
        100
      );
      return versions;
    } catch (err) {
      console.error('Failed to fetch whiteboard versions:', err);
      return [];
    }
  }

  static async deleteVersion(base44, versionId) {
    try {
      await base44.entities.WhiteboardVersion.delete(versionId);
    } catch (err) {
      console.error('Failed to delete whiteboard version:', err);
      throw err;
    }
  }

  static async cleanupOldVersions(base44, callId, maxVersions = 50) {
    try {
      const versions = await this.getVersions(base44, callId);
      if (versions.length > maxVersions) {
        const toDelete = versions.slice(0, versions.length - maxVersions);
        for (const version of toDelete) {
          await this.deleteVersion(base44, version.id);
        }
      }
    } catch (err) {
      console.error('Failed to cleanup old versions:', err);
    }
  }
}
