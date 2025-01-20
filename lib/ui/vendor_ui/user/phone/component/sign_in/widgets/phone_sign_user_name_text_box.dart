import 'package:flutter/material.dart';

import '../../../../../../../config/ps_colors.dart';
import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../core/vendor/utils/utils.dart';

class PhoneSignUserNameTextBox extends StatelessWidget {
  const PhoneSignUserNameTextBox({
    required this.nameController,
  });

  final TextEditingController? nameController;
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Container(
          margin: const EdgeInsets.only(bottom: 8),
          child: Text(
            'edit_profile__user_name'.tr,
            style: Theme.of(context).textTheme.labelLarge!.copyWith(
                fontWeight: FontWeight.w500,
                color: Utils.isLightMode(context)
                    ? PsColors.text800
                    : PsColors.achromatic50),
          ),
        ),
        SizedBox(
          height: PsDimens.space40,
          child: TextField(
            controller: nameController,
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
      ],
    );
  }
}
