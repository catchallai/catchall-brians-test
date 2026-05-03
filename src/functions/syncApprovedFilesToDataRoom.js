import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// deno-lint-ignore no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { projectId, dataRoomId } = payload;

    if (!projectId || !dataRoomId) {
      return Response.json({ error: 'Missing projectId or dataRoomId' }, { status: 400 });
    }

    // Get data room config
    const dataRoom = await base44.asServiceRole.entities.ProjectDataRoom.get(dataRoomId);

    if (!dataRoom || !dataRoom.auto_sync_approved_folder) {
      return Response.json({ error: 'Data room not found or auto-sync disabled' }, { status: 404 });
    }

    // Find the Approved folder for this project
    const folders = await base44.asServiceRole.entities.MediaFolder.filter({
      project_id: projectId,
      folder_type: 'approved',
    });

    if (!folders.length) {
      return Response.json({ synced: 0, message: 'No Approved folder found' });
    }

    const approvedFolderId = folders[0].id;

    // Get all files/assets in Approved folder
    const mediaAssets = await base44.asServiceRole.entities.MediaAsset.filter({
      folder_id: approvedFolderId,
    });

    // Create data room shares for each asset
    const synced = [];

    for (const asset of mediaAssets) {
      try {
        // Check if share already exists
        const existingShare = await base44.asServiceRole.entities.DataRoomFile.filter({
          data_room_id: dataRoomId,
          media_asset_id: asset.id,
        });

        if (!existingShare.length) {
          const share = await base44.asServiceRole.entities.DataRoomFile.create({
            data_room_id: dataRoomId,
            project_id: projectId,
            media_asset_id: asset.id,
            file_name: asset.file_name || asset.name,
            file_url: asset.file_url,
            file_size: asset.file_size,
            file_type: asset.file_type || asset.mime_type,
            uploaded_by: asset.created_by,
            uploaded_at: asset.created_date,
            is_synced: true,
          });
          synced.push(share);
        }
      } catch (error) {
        console.error(`Error syncing asset ${asset.id}:`, error);
      }
    }

    return Response.json({
      synced: synced.length,
      total: mediaAssets.length,
      message: `Synced ${synced.length} files to data room`,
    });
  } catch (error) {
    console.error('Error in syncApprovedFilesToDataRoom:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});