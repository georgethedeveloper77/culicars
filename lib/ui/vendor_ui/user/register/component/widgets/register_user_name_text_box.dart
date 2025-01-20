import 'package:flutter/material.dart';

import '../../../../../../config/ps_colors.dart';
import '../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../core/vendor/utils/utils.dart';

class RegisterUserNameTextBox extends StatelessWidget {
  const RegisterUserNameTextBox({
    required this.userNameController,
  });

  final TextEditingController? userNameController;
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(
          left: PsDimens.space16, right: PsDimens.space16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Text(
              'register_user_name_title'.tr,
              style: Theme.of(context).textTheme.labelLarge!.copyWith(
                  fontWeight: FontWeight.w500,
                  color: Utils.isLightMode(context)
                      ? PsColors.text800
                      : PsColors.achromatic50),
            ),
          ),
          SizedBox(
            height: 40,
            child: TextField(
              controller: userNameController,
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(),
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                contentPadding:
                    const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(width: 1.0, color: PsColors.text300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(width: 1.0, color: PsColors.text300),
                ),
                hintText: 'register__user_name'.tr,
                hintStyle: Theme.of(context)
                    .textTheme
                    .labelLarge!
                    .copyWith(color: PsColors.text400),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(
              left: PsDimens.space4,
              top: PsDimens.space4,
              right: PsDimens.space4,
            ),
            child: Text(
              'register_username__desc'.tr,
              style: Theme.of(context).textTheme.bodySmall!.copyWith(
                  color: Utils.isLightMode(context)
                      ? PsColors.text300
                      : PsColors.achromatic50),
            ),
          ),
        ],
      ),
    );
  }
}
