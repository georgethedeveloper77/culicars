import 'package:flutter/material.dart';

import '../../../../vendor_ui/user/password_update/component/pwd_change_button.dart';

class CustomPwdChangeSaveButton extends StatelessWidget {
  const CustomPwdChangeSaveButton({
    required this.passwordController,
    required this.confirmPasswordController,
  });

  final TextEditingController passwordController, confirmPasswordController;

  @override
  Widget build(BuildContext context) {
    return PwdChangeSaveButton(
      confirmPasswordController: confirmPasswordController,
      passwordController: passwordController,
    );
  }
}
