import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../../../../config/route/route_paths.dart';
import '../../../../../../../core/vendor/api/common/ps_resource.dart';
import '../../../../../../../core/vendor/api/common/ps_status.dart';
import '../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../../core/vendor/provider/user/user_provider.dart';
import '../../../../../../../core/vendor/utils/ps_progress_dialog.dart';
import '../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../../core/vendor/viewobject/api_status.dart';
import '../../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../../../core/vendor/viewobject/holder/user_report_item_parameter_holder.dart';
import '../../../../../../../core/vendor/viewobject/product.dart';
import '../../../../../common/dialog/error_dialog.dart';
import '../../../../../common/dialog/report_item_dialog.dart';

class PopUpMenuWidget extends StatefulWidget {
  const PopUpMenuWidget();
  @override
  PopUpMenuWidgetState<PopUpMenuWidget> createState() =>
      PopUpMenuWidgetState<PopUpMenuWidget>();
}

class PopUpMenuWidgetState<T extends PopUpMenuWidget>
    extends State<PopUpMenuWidget> {
  late ItemDetailProvider itemDetailProvider;
  late PsValueHolder psValueHolder;
  late UserProvider userProvider;
  late String loginUserId;
  late Product currentProduct;
  late AppLocalization langProvider;
  Future<void> _onSelect(String value) async {
    switch (value) {
      case '1':
        if (await Utils.checkInternetConnectivity()) {
          Utils.navigateOnUserVerificationView(context, () async {
            showDialog<dynamic>(
              context: context,
              builder: (BuildContext context) {
                return ReportConfirmDialogView(onAgreeTap: () async {
                  await PsProgressDialog.showDialog(context);

                  final UserReportItemParameterHolder
                      userReportItemParameterHolder =
                      UserReportItemParameterHolder(
                          itemId: currentProduct.id,
                          reportedUserId:
                              Utils.checkUserLoginId(psValueHolder));

                  final PsResource<ApiStatus> _apiStatus =
                      await userProvider.userReportItem(
                          userReportItemParameterHolder.toMap(),
                          Utils.checkUserLoginId(psValueHolder));

                  if (_apiStatus.status == PsStatus.SUCCESS) {
                    await PsProgressDialog.dismissDialog();

                    Navigator.of(context).pushNamedAndRemoveUntil(
                      RoutePaths.home,
                      (Route<dynamic> route) => false,
                      arguments: true,
                    );

                    await itemDetailProvider.deleteLocalProductCacheById(
                        currentProduct.id,
                        Utils.checkUserLoginId(psValueHolder));
                  } else {
                    Navigator.pop(context);
                    await PsProgressDialog.dismissDialog();
                    showDialog<dynamic>(
                        context: context,
                        builder: (BuildContext context) {
                          return ErrorDialog(message: _apiStatus.message);
                        });
                  }
                });
              },
            );
          });
        }

        break;
      default:
        print('English');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    itemDetailProvider = Provider.of<ItemDetailProvider>(context);
    psValueHolder = Provider.of<PsValueHolder>(context);
    userProvider = Provider.of<UserProvider>(context, listen: false);
    langProvider = Provider.of<AppLocalization>(context);
    currentProduct = itemDetailProvider.product;
    loginUserId = Utils.checkUserLoginId(psValueHolder);

    /**UI Section is here */
    return PopupMenuButton<String>(
      onSelected: _onSelect,
      icon: Icon(
        Icons.more_vert,
        color: Theme.of(context).primaryColor,
      ),
      itemBuilder: (BuildContext context) {
        return <PopupMenuEntry<String>>[
          PopupMenuItem<String>(
            value: '1',
            child: Text(
              'item_detail__report_item'.tr,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ),
        ];
      },
      elevation: 4,
      padding: const EdgeInsets.symmetric(horizontal: 8),
    );
  }
}
