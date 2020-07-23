exports.generateGetVideosQuery = function (roleId) {
  query = `   
            DECLARE     @playlistID int;

            SET         @playlistID = (
                            SELECT  ID
                            FROM	Playlists
                            WHERE	RoleID = ${roleId}
                        )
            SELECT      v.VimeoID, 
                        v.Name, 
                        plv.DisplayOrder
            FROM        Videos v
            INNER JOIN  PlaylistVideos plv 
            ON          v.ID = plv.VideoID
            WHERE       plv.PlaylistID = @playlistID`

  // console.log('VIDEOS '.repeat(100))
  // console.log(query)
	return query;
}