import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:psxmpc/config/ps_colors.dart';

import '../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../core/vendor/provider/user/user_provider.dart';
import '../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../custom_ui/dashboard/components/home/widgets/header_card/home_location_widget.dart';
import 'header_card/sell_now_widget.dart';

class HeaderCard extends StatefulWidget {
  @override
  _HeaderCardState createState() => _HeaderCardState();
}

class _HeaderCardState extends State<HeaderCard> {
  late PsValueHolder psValueHolder;
  late UserProvider provider;
  late AppLocalization langProvider;

  @override
  Widget build(BuildContext context) {
    psValueHolder = Provider.of<PsValueHolder>(context);
    provider = Provider.of<UserProvider>(context);
    langProvider = Provider.of<AppLocalization>(context);

    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.only(
            left: PsDimens.space10,
            right: PsDimens.space10,
            top: PsDimens.space10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            if (isUserValid) SellNowWidget(),
            const SizedBox(
              height: PsDimens.space16,
            ),
            CustomHomeLocationWidget(),
            Padding(
              padding: const EdgeInsets.only(
                  left: PsDimens.space10,
                  right: PsDimens.space8,
                  top: PsDimens.space8),
              child: Text(
                'header_discover_your'.tr,
                textAlign: TextAlign.right,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge!
                    .copyWith(color: PsColors.text900, fontSize: 30),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(
                  left: PsDimens.space10,
                  right: PsDimens.space8,
                  top: PsDimens.space8),
              child: Text(
                'header_fav_vehicle'.tr,
                textAlign: TextAlign.right,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge!
                    .copyWith(color: PsColors.text900, fontSize: 30),
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool get isUserValid {
    //allow all users, if logined or not
    if (psValueHolder.uploadSetting == PsConst.UPLOAD_SETTING_ALL) {
      return true;
    } else {
      if (Utils.isLoginUserEmpty(psValueHolder)) {
        //login user is empty, don't show item-add button
        return false;
      } else {
        /*load user data*/
        if (provider.hasData &&
            provider.data.data!.userId != psValueHolder.loginUserId) {
          provider.getUser(psValueHolder.loginUserId ?? '',
              langProvider.currentLocale.languageCode);
        }

        //only admin and bluemark users are allowed
        if (psValueHolder.uploadSetting ==
            PsConst.UPLOAD_SETTING_ADMIN_AND_BLUEMARK) {
          return provider.hasData &&
              (provider.user.data!.roleId == PsConst.ONE ||
                  provider.user.data!.isVefifiedBlueMarkUser);
        }
        //only admin is allowed
        else if (psValueHolder.uploadSetting ==
            PsConst.UPLOAD_SETTING_ONLY_ADMIN) {
          return provider.hasData && provider.user.data!.roleId == PsConst.ONE;
        }
        //default: all users are allowed
        else {
          return true;
        }
      }
    }
  }
}
