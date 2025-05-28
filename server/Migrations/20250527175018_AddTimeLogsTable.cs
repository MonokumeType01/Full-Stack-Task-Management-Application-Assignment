using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeLogsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeLog_Tasks_TaskId",
                table: "TimeLog");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TimeLog",
                table: "TimeLog");

            migrationBuilder.RenameTable(
                name: "TimeLog",
                newName: "TimeLogs");

            migrationBuilder.RenameIndex(
                name: "IX_TimeLog_TaskId",
                table: "TimeLogs",
                newName: "IX_TimeLogs_TaskId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TimeLogs",
                table: "TimeLogs",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeLogs_Tasks_TaskId",
                table: "TimeLogs",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeLogs_Tasks_TaskId",
                table: "TimeLogs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TimeLogs",
                table: "TimeLogs");

            migrationBuilder.RenameTable(
                name: "TimeLogs",
                newName: "TimeLog");

            migrationBuilder.RenameIndex(
                name: "IX_TimeLogs_TaskId",
                table: "TimeLog",
                newName: "IX_TimeLog_TaskId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TimeLog",
                table: "TimeLog",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeLog_Tasks_TaskId",
                table: "TimeLog",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
