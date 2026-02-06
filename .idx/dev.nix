{pkgs}: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
  ];
  services.postgres.enable = false;
  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
    ];
    workspace = {
      onCreate = {
        default = "npm install";
      };
    };
    previews = {
      enable = true;
      previews = [
        {
          command = ["npm" "start"];
          manager = "web";
          id = "web";
          env = {
            PORT = "3000";
          };
        }
      ];
    };
  };
}
