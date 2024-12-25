import { d4hInstance } from '../initD4H'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite';
import fs from 'fs'


async function insertMembers(response: any) {
  try {
    // Open SQLite database
    const db = await open({
      filename: '../mydatabase.db',
      driver: sqlite3.Database,
    });

    // Ensure the MemberQualificationAward table exists with additional columns
    await db.run(`
      CREATE TABLE IF NOT EXISTS MemberQualificationAward (
        memberid INTEGER PRIMARY KEY,
        ref TEXT,
        lastName TEXT,
        firstName TEXT,
        birthday TEXT,
        "845" TEXT,
        "846" TEXT,
        "847" TEXT,
        Z1 TEXT
      )
    `);

    // Modify insert statement to include additional columns, with empty values
    const stmt = await db.prepare(`
      INSERT OR REPLACE INTO MemberQualificationAward
        (memberid, ref, lastName, firstName, birthday, "845", "846", "847", Z1)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Loop through each item in the response and insert the memberid, leaving other columns empty
    for (const item of response) {
      for (const result of item.results) {
        const { member } = result;
        console.log("Insert members response:", response);

        // Execute the insert statement with the memberid and empty columns
        await stmt.run(
          member.id,  // memberId as primary key
          member.ref, // DEM #
          '', // lastName is empty
          '', // firstName is empty
          '', // birthday is empty
          '', // 845 is empty
          '', // 846 is empty
          '', // 847 is empty
          ''  // Z1 is empty
        );
      }
    }

    // Finalize and close the statement and db connection
    await stmt.finalize();
    console.log("Data inserted successfully");

    // Close the db connection
    await db.close();
  } catch (err) {
    console.error("Error inserting data:", err);
  }
}

const fetchMembers = async () => {
  try {
    const memberList = await d4hInstance.getMemberAwards('team', 1614, { qualification_id: 28241 });
    return memberList;
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
};

const updateMemberDetails = async () => {
  try {
    // Open SQLite database
    const db = await open({
      filename: '../mydatabase.db',
      driver: sqlite3.Database,
    });

    // Get all member IDs from the database
    const memberIds = await db.all(`SELECT memberid FROM MemberQualificationAward`);

    for (const member of memberIds) {
      const memberId = Number(member.memberid);

      try {
        // Fetch member details
        const memberDetail = await d4hInstance.getMember('team', 1614, memberId);

        let lastName = '';
        let firstName = '';

        if (memberDetail.name) {
          const nameParts = memberDetail.name.split(',');
          lastName = nameParts[0]?.trim() ?? '';
          firstName = nameParts[1]?.trim() ?? '';
        }

        // Update member details (lastName, firstName)
        await db.run(
          `UPDATE MemberQualificationAward 
          SET lastName = ?, firstName = ? 
          WHERE memberid = ?`,
          lastName,
          firstName,
          memberId
        );

        // Fetch member qualification awards
        const awardsResponse = await d4hInstance.getMemberAwards('team', 1614, { qualification_id: 28234, member_id: memberId });
        
        console.log(`Awards response for member ${memberId}:`, awardsResponse);

        // If awardsResponse[0] is structured and contains results, process it
        if (awardsResponse && Array.isArray(awardsResponse) && awardsResponse.length > 0) {
          const results = awardsResponse[0];

          if (Array.isArray(results)) {
            // Proceed with processing if results is an array
            const hasQualification = results.some((award: any) => award?.member?.id === memberId);

            // Update the '845' column based on qualification status
            await db.run(
              `UPDATE MemberQualificationAward 
              SET "845" = ? 
              WHERE memberid = ?`,
              hasQualification ? 'true' : 'false',
              memberId
            );

            console.log(`Updated member ${memberId} with qualification.`);
          } else {
            console.log(`No results found for member ${memberId}`);
          }
        } else {
          console.log(`Invalid awards response structure for member ${memberId}`);
        }
        
      } catch (err) {
        console.error(`Error processing member ${memberId}:`, err);
      }
    }

    console.log("Finished updating member details.");
    await db.close();
  } catch (err) {
    console.error("Error during the database operation:", err);
  }
};





export class RefreshMembers {
  async refreshMembers() {
    let members: any
    try {
      members = await fetchMembers();
    } catch (error) {
      return console.error('Error Fetching Members:', error)
    }
    try {
      await insertMembers(members)
    } catch (error) {
      return console.error('Error writing members to db:', error)
    }
    try {
      await updateMemberDetails()
    } catch (error) {
      return console.error('Error getting member details:', error)
    }
  }
}
