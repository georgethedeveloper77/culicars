import 'package:flutter/material.dart';

import '../../../../../../vendor_ui/user/phone/component/verify_phone/widgets/back_to_login_in_verify_widget.dart';

class CustomBackToLoginInVerifyWidget extends StatelessWidget {
  const CustomBackToLoginInVerifyWidget({required this.onPhoneSignInSelected});
  final Function? onPhoneSignInSelected;
  @override
  Widget build(BuildContext context) {
    return BackToLoginInVerifyWidget(onPhoneSignInSelected: onPhoneSignInSelected);
  }
}
